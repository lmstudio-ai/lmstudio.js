import {
  Event,
  SimpleLogger,
  text,
  Validator,
  type LoggerInterface,
  type SignalLike,
  type WriteTag,
} from "@lmstudio/lms-common";
import type {
  BackendInterface,
  ChannelEndpoint,
  ClientToServerMessage,
  ServerTransport,
  ServerTransportFactory,
} from "@lmstudio/lms-communication";
import { Channel } from "@lmstudio/lms-communication";
import {
  type ChannelEndpointsSpecBase,
  type RpcEndpointsSpecBase,
  type SignalEndpoint,
  type SignalEndpointsSpecBase,
  type WritableSignalEndpoint,
  type WritableSignalEndpointsSpecBase,
} from "@lmstudio/lms-communication/dist/BackendInterface";
import { serializeError } from "@lmstudio/lms-shared-types";
import { applyPatches, enablePatches } from "immer";
import { type Context, type ContextCreator } from "./Authenticator";

enablePatches();

interface OpenChannel {
  endpoint: ChannelEndpoint;
  channel: Channel<any, any>;
  receivedAck: (ackId: number) => void;
  receivedMessage: (message: any) => void;
  errored: (error: any) => void;
  closed: () => void;
}

interface OpenSignalSubscription {
  endpoint: SignalEndpoint;
  unsubscribe: () => void;
}

interface OpenWritableSignalSubscription {
  endpoint: WritableSignalEndpoint;
  unsubscribe: () => void;
  receivedPatches: (patches: Array<any>, tags: Array<WriteTag>) => void;
}

export class ServerPort<
  TContext,
  TRpcEndpoints extends RpcEndpointsSpecBase,
  TChannelEndpoints extends ChannelEndpointsSpecBase,
  TSignalEndpoints extends SignalEndpointsSpecBase,
  TWritableSignalEndpoints extends WritableSignalEndpointsSpecBase,
> {
  private readonly transport: ServerTransport;
  private readonly logger;
  private readonly openChannels = new Map<number, OpenChannel>();
  private readonly openSignalSubscriptions = new Map<number, OpenSignalSubscription>();
  private readonly openWritableSignalSubscriptions = new Map<
    number,
    OpenWritableSignalSubscription
  >();
  public readonly closeEvent: Event<void>;
  private readonly emitCloseEvent: () => void;
  private producedCommunicationWarningsCount = 0;

  public constructor(
    private readonly backendInterface: BackendInterface<
      TContext,
      TRpcEndpoints,
      TChannelEndpoints,
      TSignalEndpoints,
      TWritableSignalEndpoints
    >,
    private readonly contextCreator: ContextCreator<Context>,
    factory: ServerTransportFactory,
    {
      parentLogger,
    }: {
      parentLogger?: LoggerInterface;
    } = {},
  ) {
    this.logger = new SimpleLogger("ServerPort", parentLogger);
    [this.closeEvent, this.emitCloseEvent] = Event.create();
    this.transport = factory(this.receivedMessage, this.errored, this.logger);
  }

  private communicationWarning(warning: string) {
    if (this.producedCommunicationWarningsCount >= 5) {
      return;
    }
    this.logger.warnText`
      Produced communication warning: ${warning}
      
      This is usually caused by communication protocol incompatibility. Please make sure you are
      using the up-to-date versions of the SDK and LM Studio.
    `;
    this.transport.send({
      type: "communicationWarning",
      warning,
    });
    this.producedCommunicationWarningsCount++;
    if (this.producedCommunicationWarningsCount >= 5) {
      this.logger.errorText`
        5 communication warnings have been produced. Further warnings will not be printed.
      `;
    }
  }

  private receivedChannelCreate(message: ClientToServerMessage & { type: "channelCreate" }) {
    const endpoint = this.backendInterface.getChannelEndpoint(message.endpoint);
    if (endpoint === undefined) {
      this.communicationWarning(
        `Received channelCreate for unknown endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (endpoint.handler === null) {
      this.communicationWarning(
        `Received channelCreate for unhandled endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (this.openChannels.has(message.channelId)) {
      this.communicationWarning(
        `Received channelCreate for already open channel, channelId = ${message.channelId}`,
      );
      return;
    }
    const parseResult = endpoint.creationParameter.safeParse(message.creationParameter);
    if (!parseResult.success) {
      this.communicationWarning(text`
        Received invalid creationParameter for channel, endpointName = ${endpoint.name},
        creationParameter = ${message.creationParameter}. Zod error:

        ${Validator.prettyPrintZod("creationParameter", parseResult.error)}
      `);

      return;
    }
    const channelId = message.channelId;
    const openChannel = {
      endpoint,
      ...Channel.create((message, ackId) => {
        const result = endpoint.toClientPacket.parse(message);
        this.transport.send({
          type: "channelSend",
          channelId,
          message: result,
          ackId: ackId,
        });
      }),
    };
    this.openChannels.set(channelId, openChannel);
    const context = this.contextCreator({
      type: "channel",
      endpointName: endpoint.name,
    });

    Promise.resolve(endpoint.handler(context, parseResult.data, openChannel.channel))
      .then(
        () => {
          this.transport.send({
            type: "channelClose",
            channelId: channelId,
          });
        },
        error => {
          this.transport.send({
            type: "channelError",
            channelId: channelId,
            error: serializeError(error),
          });
          context.logger.error("Error in channel handler:", error);
        },
      )
      .finally(() => {
        this.openChannels.delete(channelId);
      });
  }

  private receivedChannelSend(message: ClientToServerMessage & { type: "channelSend" }) {
    const openChannel = this.openChannels.get(message.channelId);
    if (openChannel === undefined) {
      this.communicationWarning(
        `Received channelSend for unknown channel, channelId = ${message.channelId}`,
      );
      return;
    }
    const parsed = openChannel.endpoint.toServerPacket.safeParse(message.message);
    if (!parsed.success) {
      this.communicationWarning(text`
        Received invalid message for channel, endpointName = ${openChannel.endpoint.name},
        message = ${message.message}. Zod error:

        ${Validator.prettyPrintZod("message", parsed.error)}
      `);
      return;
    }
    openChannel.receivedMessage(parsed.data);
  }

  private receivedChannelAck(message: ClientToServerMessage & { type: "channelAck" }) {
    const openChannel = this.openChannels.get(message.channelId);
    if (openChannel === undefined) {
      this.communicationWarning(
        `Received channelAck for unknown channel, channelId = ${message.channelId}`,
      );
      return;
    }
    openChannel.receivedAck(message.ackId);
  }

  private receivedRpcCall(message: ClientToServerMessage & { type: "rpcCall" }) {
    const endpoint = this.backendInterface.getRpcEndpoint(message.endpoint);
    if (endpoint === undefined) {
      this.communicationWarning(
        `Received rpcCall for unknown endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (endpoint.handler === null) {
      this.communicationWarning(
        `Received rpcCall for unhandled endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    const parseResult = endpoint.parameter.safeParse(message.parameter);
    if (!parseResult.success) {
      this.communicationWarning(text`
        Received invalid parameter for rpcCall, endpointName = ${endpoint.name},
        parameter = ${message.parameter}. Zod error:

        ${Validator.prettyPrintZod("parameter", parseResult.error)}
      `);
      return;
    }
    const context = this.contextCreator({
      type: "rpc",
      endpointName: endpoint.name,
    });
    const result = endpoint.handler(context, parseResult.data);
    Promise.resolve(result)
      .then(value => {
        this.transport.send({
          type: "rpcResult",
          callId: message.callId,
          result: value,
        });
      })
      .catch(error => {
        this.transport.send({
          type: "rpcError",
          callId: message.callId,
          error: serializeError(error),
        });
        context.logger.error("Error in RPC handler:", error);
      });
  }

  private receivedSignalSubscribe(message: ClientToServerMessage & { type: "signalSubscribe" }) {
    const endpoint = this.backendInterface.getSignalEndpoint(message.endpoint);
    if (endpoint === undefined) {
      this.communicationWarning(
        `Received signalSubscribe for unknown endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (endpoint.handler === null) {
      this.communicationWarning(
        `Received signalSubscribe for unhandled endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (this.openSignalSubscriptions.has(message.subscribeId)) {
      this.communicationWarning(text`
        Received signalSubscribe for already open subscription, subscribeId =
        ${message.subscribeId}
      `);
      return;
    }
    const parseResult = endpoint.creationParameter.safeParse(message.creationParameter);
    if (!parseResult.success) {
      this.communicationWarning(text`
        Received invalid parameter for signalSubscribe, endpointName = ${endpoint.name},
        creationParameter = ${message.creationParameter}. Zod error:

        ${Validator.prettyPrintZod("creationParameter", parseResult.error)}
      `);
      return;
    }
    const context = this.contextCreator({
      type: "signal",
      endpointName: endpoint.name,
    });
    Promise.resolve(endpoint.handler(context, parseResult.data))
      .then((signal: SignalLike<any>) => {
        this.transport.send({
          type: "signalUpdate",
          subscribeId: message.subscribeId,
          patches: [
            {
              op: "replace",
              path: [],
              value: signal.get(),
            },
          ],
          tags: [],
        });
        this.openSignalSubscriptions.set(message.subscribeId, {
          endpoint,
          unsubscribe: signal.subscribe((_value, patches, tags) => {
            this.transport.send({
              type: "signalUpdate",
              subscribeId: message.subscribeId,
              patches,
              tags,
            });
          }),
        });
      })
      .catch(error => {
        this.transport.send({
          type: "signalError",
          subscribeId: message.subscribeId,
          error: serializeError(error),
        });
        context.logger.error("Error in signal handler:", error);
      });
  }

  private receivedSignalUnsubscribe(
    message: ClientToServerMessage & { type: "signalUnsubscribe" },
  ) {
    const openSignalSubscription = this.openSignalSubscriptions.get(message.subscribeId);
    if (openSignalSubscription === undefined) {
      this.communicationWarning(
        `Received signalUnsubscribe for unknown subscription, subscribeId = ${message.subscribeId}`,
      );
      return;
    }
    openSignalSubscription.unsubscribe();
    this.openSignalSubscriptions.delete(message.subscribeId);
  }

  private receivedWritableSignalSubscribe(
    message: ClientToServerMessage & { type: "writableSignalSubscribe" },
  ) {
    const endpoint = this.backendInterface.getWritableSignalEndpoint(message.endpoint);
    if (endpoint === undefined) {
      this.communicationWarning(
        `Received writableSignalSubscribe for unknown endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (endpoint.handler === null) {
      this.communicationWarning(
        `Received writableSignalSubscribe for unhandled endpoint, endpoint = ${message.endpoint}`,
      );
      return;
    }
    if (this.openWritableSignalSubscriptions.has(message.subscribeId)) {
      this.communicationWarning(text`
        Received writableSignalSubscribe for already open subscription, subscribeId =
        ${message.subscribeId}
      `);
      return;
    }
    const parseResult = endpoint.creationParameter.safeParse(message.creationParameter);
    if (!parseResult.success) {
      this.communicationWarning(text`
        Received invalid parameter for writableSignalSubscribe, endpointName = ${endpoint.name},
        creationParameter = ${message.creationParameter}. Zod error:

        ${Validator.prettyPrintZod("creationParameter", parseResult.error)}
      `);
      return;
    }
    const context = this.contextCreator({
      type: "writableSignal",
      endpointName: endpoint.name,
    });
    Promise.resolve(endpoint.handler(context, parseResult.data))
      .then(([signal, update]) => {
        this.transport.send({
          type: "writableSignalUpdate",
          subscribeId: message.subscribeId,
          patches: [
            {
              op: "replace",
              path: [],
              value: signal.get(),
            },
          ],
          tags: [],
        });
        this.openWritableSignalSubscriptions.set(message.subscribeId, {
          endpoint,
          unsubscribe: signal.subscribe((_value, patches, tags) => {
            this.transport.send({
              type: "writableSignalUpdate",
              subscribeId: message.subscribeId,
              patches,
              tags,
            });
          }),
          receivedPatches: (patches, tags) => {
            const data = signal.get();
            const result = applyPatches(data, patches);
            const parseResult = endpoint.signalData.safeParse(result);
            if (!parseResult.success) {
              this.communicationWarning(text`
                Received invalid data for writable signal, endpointName = ${endpoint.name},
                data = ${result}. Zod error:

                ${Validator.prettyPrintZod("data", parseResult.error)}
              `);
              return;
            }
            update(parseResult.data, patches, tags);
          },
        });
      })
      .catch(error => {
        this.transport.send({
          type: "writableSignalError",
          subscribeId: message.subscribeId,
          error: serializeError(error),
        });
        context.logger.error("Error in writable signal handler:", error);
      });
  }

  private receivedWritableSignalUnsubscribe(
    message: ClientToServerMessage & { type: "writableSignalUnsubscribe" },
  ) {
    const openWritableSignalSubscription = this.openWritableSignalSubscriptions.get(
      message.subscribeId,
    );
    if (openWritableSignalSubscription === undefined) {
      this.communicationWarning(
        `Received writableSignalUnsubscribe for unknown subscription, subscribeId = ${message.subscribeId}`,
      );
      return;
    }
    openWritableSignalSubscription.unsubscribe();
    this.openWritableSignalSubscriptions.delete(message.subscribeId);
  }

  private receivedWritableSignalUpdate(
    message: ClientToServerMessage & { type: "writableSignalUpdate" },
  ) {
    const openWritableSignalSubscription = this.openWritableSignalSubscriptions.get(
      message.subscribeId,
    );
    if (openWritableSignalSubscription === undefined) {
      this.communicationWarning(
        `Received writableSignalUpdate for unknown subscription, subscribeId = ${message.subscribeId}`,
      );
      return;
    }
    openWritableSignalSubscription.receivedPatches(message.patches, message.tags);
  }

  private receivedCommunicationWarning(
    message: ClientToServerMessage & { type: "communicationWarning" },
  ) {
    this.logger.warnText`
      Received communication warning from the client: ${message.warning}
      
      This is usually caused by communication protocol incompatibility. Please make sure you are
      using the up-to-date versions of the SDK and LM Studio.

      Note: This warning was produced by the client and is printed on the server for convenience.
    `;
  }

  private receivedKeepAlive(_message: ClientToServerMessage & { type: "keepAlive" }) {
    this.transport.send({
      type: "keepAliveAck",
    });
  }

  private receivedMessage = (message: ClientToServerMessage) => {
    switch (message.type) {
      case "channelCreate": {
        this.receivedChannelCreate(message);
        break;
      }
      case "channelSend": {
        this.receivedChannelSend(message);
        break;
      }
      case "channelAck": {
        this.receivedChannelAck(message);
        break;
      }
      case "rpcCall": {
        this.receivedRpcCall(message);
        break;
      }
      case "signalSubscribe": {
        this.receivedSignalSubscribe(message);
        break;
      }
      case "signalUnsubscribe": {
        this.receivedSignalUnsubscribe(message);
        break;
      }
      case "writableSignalSubscribe": {
        this.receivedWritableSignalSubscribe(message);
        break;
      }
      case "writableSignalUnsubscribe": {
        this.receivedWritableSignalUnsubscribe(message);
        break;
      }
      case "writableSignalUpdate": {
        this.receivedWritableSignalUpdate(message);
        break;
      }
      case "communicationWarning": {
        this.receivedCommunicationWarning(message);
        break;
      }
      case "keepAlive": {
        this.receivedKeepAlive(message);
        break;
      }
    }
  };
  private errored = (error: any) => {
    for (const openChannel of this.openChannels.values()) {
      openChannel.errored(error);
    }
    for (const openSignalSubscription of this.openSignalSubscriptions.values()) {
      openSignalSubscription.unsubscribe();
    }
    for (const openWritableSignalSubscription of this.openWritableSignalSubscriptions.values()) {
      openWritableSignalSubscription.unsubscribe();
    }
    this.emitCloseEvent();
  };
}
