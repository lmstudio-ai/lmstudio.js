import {
  SimpleLogger,
  changeErrorStackInPlace,
  getCurrentStack,
  makePromise,
  prettyPrintZod,
  text,
  type LoggerInterface,
} from "@lmstudio/lms-common";
import type {
  BackendInterface,
  ChannelEndpoint,
  ClientTransport,
  ClientTransportFactory,
  RpcEndpoint,
  ServerToClientMessage,
} from "@lmstudio/lms-communication";
import { Channel } from "@lmstudio/lms-communication";
import {
  type ChannelEndpointsSpecBase,
  type RpcEndpointsSpecBase,
} from "@lmstudio/lms-communication/dist/BackendInterface";
import { fromSerializedError } from "@lmstudio/lms-shared-types";

interface OpenChannel {
  endpoint: ChannelEndpoint;
  stack: string;
  channel: Channel<any, any>;
  receivedAck: (ackId: number) => void;
  receivedMessage: (message: any) => void;
  errored: (error: any) => void;
  closed: () => void;
}

interface OngoingRpc {
  endpoint: RpcEndpoint;
  stack: string;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

export class ClientPort<
  TRpcEndpoints extends RpcEndpointsSpecBase,
  TChannelEndpoints extends ChannelEndpointsSpecBase,
> {
  private readonly transport: ClientTransport;
  private readonly logger;
  private openChannels = new Map<number, OpenChannel>();
  private ongoingRpcs = new Map<number, OngoingRpc>();
  private openCommunicationsCount = 0;
  private nextChannelId = 0;
  private producedCommunicationWarningsCount = 0;

  public constructor(
    private readonly backendInterface: BackendInterface<unknown, TRpcEndpoints, TChannelEndpoints>,
    factory: ClientTransportFactory,
    {
      parentLogger,
    }: {
      parentLogger?: LoggerInterface;
    } = {},
  ) {
    this.logger = new SimpleLogger("ClientPort", parentLogger);
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

  private updateOpenCommunicationsCount() {
    const previousCount = this.openCommunicationsCount;
    this.openCommunicationsCount = this.openChannels.size + this.ongoingRpcs.size;
    if (this.openCommunicationsCount === 0 && previousCount > 0) {
      this.transport.onHavingNoOpenCommunication();
    } else if (this.openCommunicationsCount === 1 && previousCount === 0) {
      this.transport.onHavingOneOrMoreOpenCommunication();
    }
  }

  private receivedChannelSend(message: ServerToClientMessage & { type: "channelSend" }) {
    const openChannel = this.openChannels.get(message.channelId);
    if (openChannel === undefined) {
      this.communicationWarning(
        `Received channelSend for unknown channel, channelId = ${message.channelId}`,
      );
      return;
    }
    const parsed = openChannel.endpoint.toClientPacket.safeParse(message.message);
    if (!parsed.success) {
      this.communicationWarning(text`
        Received invalid message for channel: endpointName = ${openChannel.endpoint.name}, message =
        ${message.message}. Zod error:

        ${prettyPrintZod("message", parsed.error)}
      `);
      return;
    }
    openChannel.receivedMessage(parsed.data);
  }

  private receivedChannelAck(message: ServerToClientMessage & { type: "channelAck" }) {
    const openChannel = this.openChannels.get(message.channelId);
    if (openChannel === undefined) {
      this.communicationWarning(
        `Received channelAck for unknown channel, channelId = ${message.channelId}`,
      );
      return;
    }
    openChannel.receivedAck(message.ackId);
  }

  private receivedChannelClose(message: ServerToClientMessage & { type: "channelClose" }) {
    const openChannel = this.openChannels.get(message.channelId);
    if (openChannel === undefined) {
      this.communicationWarning(
        `Received channelClose for unknown channel, channelId = ${message.channelId}`,
      );
      return;
    }
    this.openChannels.delete(message.channelId);
    openChannel.closed();
    this.updateOpenCommunicationsCount();
  }

  private receivedChannelError(message: ServerToClientMessage & { type: "channelError" }) {
    const openChannel = this.openChannels.get(message.channelId);
    if (openChannel === undefined) {
      this.communicationWarning(
        `Received channelError for unknown channel, channelId = ${message.channelId}`,
      );
      return;
    }
    this.openChannels.delete(message.channelId);
    const error = fromSerializedError(message.error);
    changeErrorStackInPlace(error, openChannel.stack);
    openChannel.errored(error);
    this.updateOpenCommunicationsCount();
  }

  private receivedRpcResult(message: ServerToClientMessage & { type: "rpcResult" }) {
    const ongoingRpc = this.ongoingRpcs.get(message.callId);
    if (ongoingRpc === undefined) {
      this.communicationWarning(`Received rpcResult for unknown rpc, callId = ${message.callId}`);
      return;
    }
    const parsed = ongoingRpc.endpoint.returns.safeParse(message.result);
    if (!parsed.success) {
      this.communicationWarning(text`
        Received invalid result for rpc, endpointName = ${ongoingRpc.endpoint.name}, result =
        ${message.result}. Zod error:

        ${prettyPrintZod("result", parsed.error)}
      `);
      return;
    }
    ongoingRpc.resolve(parsed.data);
    this.ongoingRpcs.delete(message.callId);
    this.updateOpenCommunicationsCount();
  }

  private receivedRpcError(message: ServerToClientMessage & { type: "rpcError" }) {
    const ongoingRpc = this.ongoingRpcs.get(message.callId);
    if (ongoingRpc === undefined) {
      this.communicationWarning(`Received rpcError for unknown rpc, callId = ${message.callId}`);
      return;
    }
    const error = fromSerializedError(message.error);
    changeErrorStackInPlace(error, ongoingRpc.stack);
    ongoingRpc.reject(error);
    this.ongoingRpcs.delete(message.callId);
    this.updateOpenCommunicationsCount();
  }

  private receivedCommunicationWarning(
    message: ServerToClientMessage & { type: "communicationWarning" },
  ) {
    this.logger.warnText`
      Received communication warning from the server: ${message.warning}
      
      This is usually caused by communication protocol incompatibility. Please make sure you are
      using the up-to-date versions of the SDK and LM Studio.

      Note: This warning was received from the server and is printed on the client for convenience.
    `;
  }

  private receivedKeepAliveAck(_message: ServerToClientMessage & { type: "keepAliveAck" }) {
    // Do nothing
  }

  private receivedMessage = (message: ServerToClientMessage) => {
    switch (message.type) {
      case "channelSend": {
        this.receivedChannelSend(message);
        break;
      }
      case "channelAck": {
        this.receivedChannelAck(message);
        break;
      }
      case "channelClose": {
        this.receivedChannelClose(message);
        break;
      }
      case "channelError": {
        this.receivedChannelError(message);
        break;
      }
      case "rpcResult": {
        this.receivedRpcResult(message);
        break;
      }
      case "rpcError": {
        this.receivedRpcError(message);
        break;
      }
      case "communicationWarning": {
        this.receivedCommunicationWarning(message);
        break;
      }
      case "keepAliveAck": {
        this.receivedKeepAliveAck(message);
        break;
      }
    }
  };
  private errored = (error: any) => {
    for (const openChannel of this.openChannels.values()) {
      openChannel.errored(error);
    }
    for (const ongoingRpc of this.ongoingRpcs.values()) {
      ongoingRpc.reject(error);
    }
  };
  public async callRpc<TEndpointName extends keyof TRpcEndpoints & string>(
    endpointName: TEndpointName,
    param: TRpcEndpoints[TEndpointName]["parameter"],
  ): Promise<TRpcEndpoints[TEndpointName]["returns"]> {
    const endpoint = this.backendInterface.getRpcEndpoint(endpointName);
    if (endpoint === undefined) {
      throw new Error(`No Rpc endpoint with name ${endpointName}`);
    }
    const parameter = endpoint.parameter.parse(param);

    const callId = this.nextChannelId;
    this.nextChannelId++;

    const { promise, resolve, reject } = makePromise();

    const stack = getCurrentStack(1);
    this.ongoingRpcs.set(callId, {
      endpoint,
      stack,
      resolve,
      reject,
    });

    this.transport.send({
      type: "rpcCall",
      endpoint: endpointName,
      callId,
      parameter,
    });

    this.updateOpenCommunicationsCount();

    return await promise;
  }
  public createChannel<TEndpointName extends keyof TChannelEndpoints & string>(
    endpointName: TEndpointName,
    param: TChannelEndpoints[TEndpointName]["creationParameter"],
    onMessage?: (message: TChannelEndpoints[TEndpointName]["toClientPacket"]) => void,
  ): Channel<
    TChannelEndpoints[TEndpointName]["toClientPacket"],
    TChannelEndpoints[TEndpointName]["toServerPacket"]
  > {
    const channelEndpoint = this.backendInterface.getChannelEndpoint(endpointName);
    if (channelEndpoint === undefined) {
      throw new Error(`No channel endpoint with name ${endpointName}`);
    }
    const creationParameter = channelEndpoint.creationParameter.parse(param);

    const channelId = this.nextChannelId;
    this.nextChannelId++;

    this.transport.send({
      type: "channelCreate",
      endpoint: endpointName,
      channelId,
      creationParameter,
    });

    const stack = getCurrentStack(1);

    const openChannel: OpenChannel = {
      endpoint: channelEndpoint,
      stack,
      ...Channel.create(packet => {
        const result = channelEndpoint.toServerPacket.parse(packet);
        this.transport.send({
          type: "channelSend",
          channelId,
          message: result,
        });
      }),
    };

    if (onMessage !== undefined) {
      openChannel.channel.onMessage.subscribe(onMessage);
    }

    this.openChannels.set(channelId, openChannel);
    this.updateOpenCommunicationsCount();
    return openChannel.channel;
  }
}

export type InferClientPort<TBackendInterfaceOrCreator> =
  TBackendInterfaceOrCreator extends BackendInterface<
    infer _TContext,
    infer TRpcEndpoints,
    infer TChannelEndpoints
  >
    ? ClientPort<TRpcEndpoints, TChannelEndpoints>
    : TBackendInterfaceOrCreator extends () => BackendInterface<
          infer _TContext,
          infer TRpcEndpoints,
          infer TChannelEndpoints
        >
      ? ClientPort<TRpcEndpoints, TChannelEndpoints>
      : never;
