import { BufferedEvent, SimpleLogger } from "@lmstudio/lms-common";
import {
  type BackendInterface,
  type ClientToServerMessage,
  type ServerToClientMessage,
} from "@lmstudio/lms-communication";
import { ClientPort, GenericClientTransport } from "@lmstudio/lms-communication-client";
import {
  type Context,
  type ContextCreator,
} from "@lmstudio/lms-communication-server/dist/Authenticator";
import { GenericServerTransport } from "@lmstudio/lms-communication-server/dist/GenericServerTransport";
import { ServerPort } from "@lmstudio/lms-communication-server/dist/ServerPort";
import {
  type ChannelEndpointsSpecBase,
  type RpcEndpointsSpecBase,
} from "@lmstudio/lms-communication/dist/BackendInterface";

export function createMockedPorts<
  TContext extends Context,
  TRpcEndpoints extends RpcEndpointsSpecBase,
  TChannelEndpoints extends ChannelEndpointsSpecBase,
>(
  backendInterface: BackendInterface<TContext, TRpcEndpoints, TChannelEndpoints>,
  contextCreator: ContextCreator<TContext>,
): {
  clientPort: ClientPort<TRpcEndpoints, TChannelEndpoints>;
  serverPort: ServerPort<TContext, TRpcEndpoints, TChannelEndpoints>;
} {
  const [toClientMessageEvent, emitToClientMessageEvent] =
    BufferedEvent.create<ServerToClientMessage>();
  const [toServerMessageEvent, emitToServerMessageEvent] =
    BufferedEvent.create<ClientToServerMessage>();
  const [clientCloseEvent, _emitCloseEvent] = BufferedEvent.create<void>();
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
