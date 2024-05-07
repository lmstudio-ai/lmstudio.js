import { BufferedEvent, type SimpleLogger } from "@lmstudio/lms-common";
import {
  type AuthPacket,
  type ClientTransportFactory,
  type ServerToClientMessage,
} from "@lmstudio/lms-communication";
import {
  AuthenticatedWsClientTransport,
  ClientPort,
  GenericClientTransport,
  getHostedEnv,
  type LMStudioHostedEnv,
} from "@lmstudio/lms-communication-client";
import {
  type BackendInterface,
  type ChannelEndpointsSpecBase,
  type RpcEndpointsSpecBase,
  type SignalEndpointsSpecBase,
  type WritableSignalEndpointsSpecBase,
} from "@lmstudio/lms-communication/dist/BackendInterface";
import { type SerializedLMSExtendedError } from "@lmstudio/lms-shared-types";

function createAuthenticatedIpcTransportFactory(
  apiNamespace: string,
  hostedEnv: LMStudioHostedEnv,
  clientIdentifier: string,
  clientPasskey: string,
): ClientTransportFactory {
  const [onMessage, emitOnMessage] = BufferedEvent.create<ServerToClientMessage>();
  const [onClose, emitOnClose] = BufferedEvent.create<void>();
  const sendToServer = hostedEnv.getApiIpcTunnel(
    apiNamespace,
    {
      authVersion: 1,
      clientIdentifier: clientIdentifier,
      clientPasskey: clientPasskey,
    } satisfies AuthPacket,
    emitOnMessage,
    emitOnClose,
  );
  return GenericClientTransport.createFactory(onMessage, onClose, sendToServer);
}

function createAuthenticatedWsTransportFactory(
  apiNamespace: string,
  wsAddress: string | Promise<string>,
  clientIdentifier: string,
  clientPasskey: string,
) {
  return AuthenticatedWsClientTransport.createAuthenticatedWsClientTransportFactory({
    url: Promise.resolve(wsAddress).then(wsAddress => `${wsAddress}/${apiNamespace}`),
    clientIdentifier: clientIdentifier,
    clientPasskey: clientPasskey,
  });
}

export function createAuthenticatedClientPort<
  TRpcEndpoints extends RpcEndpointsSpecBase,
  TChannelEndpoints extends ChannelEndpointsSpecBase,
  TSignalEndpoints extends SignalEndpointsSpecBase,
  TWritableSignalEndpoints extends WritableSignalEndpointsSpecBase,
>(
  backendInterface: BackendInterface<
    never,
    TRpcEndpoints,
    TChannelEndpoints,
    TSignalEndpoints,
    TWritableSignalEndpoints
  >,
  wsAddress: string | Promise<string>,
  apiNamespace: string,
  clientIdentifier: string,
  clientPasskey: string,
  logger: SimpleLogger,
  {
    errorDeserializer,
    verboseErrorMessage,
  }: {
    errorDeserializer?: (serialized: SerializedLMSExtendedError) => Error;
    verboseErrorMessage?: boolean;
  } = {},
): ClientPort<TRpcEndpoints, TChannelEndpoints, TSignalEndpoints, TWritableSignalEndpoints> {
  const hostedEnv = getHostedEnv();
  if (hostedEnv !== null) {
    if (wsAddress !== undefined) {
      logger.debug(
        "Ignoring wsAddress parameter when constructing the client because the client is" +
          " running in a hosted environment. This is not an error.",
      );
    }
    return new ClientPort(
      backendInterface,
      createAuthenticatedIpcTransportFactory(
        apiNamespace,
        hostedEnv,
        clientIdentifier,
        clientPasskey,
      ),
      { parentLogger: logger, errorDeserializer, verboseErrorMessage },
    );
  } else {
    return new ClientPort(
      backendInterface,
      createAuthenticatedWsTransportFactory(
        apiNamespace,
        wsAddress,
        clientIdentifier,
        clientPasskey,
      ),
      { parentLogger: logger, errorDeserializer, verboseErrorMessage },
    );
  }
}
