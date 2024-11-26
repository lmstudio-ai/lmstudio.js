import { BufferedEvent, SimpleLogger } from "@lmstudio/lms-common";
import {
  type BackendInterface,
  type ChannelEndpointsSpecBase,
  type ClientToServerMessage,
  type RpcEndpointsSpecBase,
  type ServerToClientMessage,
  type SignalEndpointsSpecBase,
  type WritableSignalEndpointsSpecBase,
} from "@lmstudio/lms-communication";
import { ClientPort, GenericClientTransport } from "@lmstudio/lms-communication-client";
import {
  GenericServerTransport,
  ServerPort,
  type Context,
  type ContextCreator,
} from "@lmstudio/lms-communication-server";

export function createMockedPorts<
  TContext extends Context,
  TRpcEndpoints extends RpcEndpointsSpecBase,
  TChannelEndpoints extends ChannelEndpointsSpecBase,
  TSignalEndpoints extends SignalEndpointsSpecBase,
  TWritableSignalEndpoints extends WritableSignalEndpointsSpecBase,
>(
  backendInterface: BackendInterface<
    TContext,
    TRpcEndpoints,
    TChannelEndpoints,
    TSignalEndpoints,
    TWritableSignalEndpoints
  >,
  contextCreator: ContextCreator<TContext>,
): {
  clientPort: ClientPort<
    TRpcEndpoints,
    TChannelEndpoints,
    TSignalEndpoints,
    TWritableSignalEndpoints
  >;
  serverPort: ServerPort<
    TContext,
    TRpcEndpoints,
    TChannelEndpoints,
    TSignalEndpoints,
    TWritableSignalEndpoints
  >;
} {
  const [toClientMessageEvent, emitToClientMessageEvent] =
    BufferedEvent.create<ServerToClientMessage>();
  const [toServerMessageEvent, emitToServerMessageEvent] =
    BufferedEvent.create<ClientToServerMessage>();
  const [clientCloseEvent, _emitClientCloseEvent] = BufferedEvent.create<void>();
  const [serverCloseEvent, _emitServerCloseEvent] = BufferedEvent.create<void>();

  const clientTransportFactory = GenericClientTransport.createFactory(
    toClientMessageEvent,
    clientCloseEvent,
    emitToServerMessageEvent,
  );

  const ServerTransportFactory = GenericServerTransport.createFactory(
    toServerMessageEvent,
    serverCloseEvent,
    emitToClientMessageEvent,
  );

  const logger = new SimpleLogger("MockedCommunication");

  const serverPort = new ServerPort(backendInterface, contextCreator, ServerTransportFactory, {
    parentLogger: logger,
  });
  const clientPort = new ClientPort(backendInterface, clientTransportFactory, {
    parentLogger: logger,
  });

  return {
    clientPort,
    serverPort,
  };
}
