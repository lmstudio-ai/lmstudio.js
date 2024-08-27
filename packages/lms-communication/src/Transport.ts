import { type LoggerInterface } from "@lmstudio/lms-common";
import { serializedLMSExtendedErrorSchema } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { serializedOpaqueSchema } from "./serialization";

const clientToServerMessageSchema = z.discriminatedUnion("type", [
  // Communication
  z.object({
    type: z.literal("communicationWarning"),
    warning: z.string(),
  }),
  z.object({
    type: z.literal("keepAlive"),
  }),

  // Channel
  z.object({
    type: z.literal("channelCreate"),
    endpoint: z.string(),
    channelId: z.number(),
    creationParameter: serializedOpaqueSchema,
  }),
  z.object({
    type: z.literal("channelSend"),
    channelId: z.number(),
    message: serializedOpaqueSchema,
    ackId: z.number().optional(),
  }),
  z.object({
    type: z.literal("channelAck"),
    channelId: z.number(),
    ackId: z.number(),
  }),

  // RPC
  z.object({
    type: z.literal("rpcCall"),
    endpoint: z.string(),
    callId: z.number(),
    parameter: serializedOpaqueSchema,
  }),

  // Readonly signal
  z.object({
    type: z.literal("signalSubscribe"),
    creationParameter: serializedOpaqueSchema,
    endpoint: z.string(),
    subscribeId: z.number(),
  }),
  z.object({
    type: z.literal("signalUnsubscribe"),
    subscribeId: z.number(),
  }),

  // Writable signal
  z.object({
    type: z.literal("writableSignalSubscribe"),
    creationParameter: serializedOpaqueSchema,
    endpoint: z.string(),
    subscribeId: z.number(),
  }),
  z.object({
    type: z.literal("writableSignalUnsubscribe"),
    subscribeId: z.number(),
  }),
  z.object({
    type: z.literal("writableSignalUpdate"),
    subscribeId: z.number(),
    patches: z.array(serializedOpaqueSchema),
    tags: z.array(z.string()),
  }),
]);

export type ClientToServerMessage = z.infer<typeof clientToServerMessageSchema>;

const serverToClientMessageSchema = z.discriminatedUnion("type", [
  // Communication
  z.object({
    type: z.literal("communicationWarning"),
    warning: z.string(),
  }),
  z.object({
    type: z.literal("keepAliveAck"),
  }),

  // Channel
  z.object({
    type: z.literal("channelSend"),
    channelId: z.number(),
    message: serializedOpaqueSchema,
    ackId: z.number().optional(),
  }),
  z.object({
    type: z.literal("channelAck"),
    channelId: z.number(),
    ackId: z.number(),
  }),
  z.object({
    type: z.literal("channelClose"),
    channelId: z.number(),
  }),
  z.object({
    type: z.literal("channelError"),
    channelId: z.number(),
    error: serializedLMSExtendedErrorSchema,
  }),

  // RPC
  z.object({
    type: z.literal("rpcResult"),
    callId: z.number(),
    result: serializedOpaqueSchema,
  }),
  z.object({
    type: z.literal("rpcError"),
    callId: z.number(),
    error: serializedLMSExtendedErrorSchema,
  }),

  // Readonly signal
  z.object({
    type: z.literal("signalUpdate"),
    subscribeId: z.number(),
    patches: z.array(serializedOpaqueSchema),
    tags: z.array(z.string()),
  }),
  z.object({
    type: z.literal("signalError"),
    subscribeId: z.number(),
    error: serializedLMSExtendedErrorSchema,
  }),

  // Writable signal
  z.object({
    type: z.literal("writableSignalUpdate"),
    subscribeId: z.number(),
    patches: z.array(serializedOpaqueSchema),
    tags: z.array(z.string()),
  }),
  z.object({
    type: z.literal("writableSignalError"),
    subscribeId: z.number(),
    error: serializedLMSExtendedErrorSchema,
  }),
]);

export type ServerToClientMessage = z.infer<typeof serverToClientMessageSchema>;

export abstract class Transport<TIncoming, TOutgoing> {
  /**
   * Implemented by ClientTransport / ServerTransport. Called by transport implementation to verify
   * incoming message.
   */
  protected abstract parseIncomingMessage(message: any): TIncoming;
  /**
   * Implemented by transport. At this point, message is already validated.
   */
  protected abstract sendViaTransport(message: TOutgoing): void;
  /**
   * Implemented by ClientTransport / ServerTransport. Call by outside to send a message.
   */
  public abstract send(message: TOutgoing): void;
}

export abstract class ClientTransport extends Transport<
  ServerToClientMessage,
  ClientToServerMessage
> {
  protected override parseIncomingMessage(message: any): ServerToClientMessage {
    return serverToClientMessageSchema.parse(message);
  }
  public override send(message: ClientToServerMessage) {
    const result = clientToServerMessageSchema.parse(message);
    this.sendViaTransport(result);
  }
  /**
   * Called by the client port when the number of open communications changes from 0 to 1. This
   * usually indicates the `socket.ref()` should be called to prevent the process from exiting.
   */
  public onHavingOneOrMoreOpenCommunication() {}
  /**
   * Called by the client port when the number of open communications changes from 1 or more to 0.
   * This usually indicates the `socket.unref()` should be called to allow the process to exit.
   */
  public onHavingNoOpenCommunication() {}
}

export type ClientTransportFactory = (
  receivedMessage: (message: ServerToClientMessage) => void,
  errored: (error: any) => void,
  parentLogger: LoggerInterface,
) => ClientTransport;

export abstract class ServerTransport extends Transport<
  ClientToServerMessage,
  ServerToClientMessage
> {
  protected override parseIncomingMessage(message: any): ClientToServerMessage {
    return clientToServerMessageSchema.parse(message);
  }
  public override send(message: ServerToClientMessage) {
    const result = serverToClientMessageSchema.parse(message);
    this.sendViaTransport(result);
  }
}
export type ServerTransportFactory = (
  receivedMessage: (message: ClientToServerMessage) => void,
  errored: (error: any) => void,
  parentLogger: LoggerInterface,
) => ServerTransport;
