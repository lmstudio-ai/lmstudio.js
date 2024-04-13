import { SimpleLogger, type BufferedEvent, type LoggerInterface } from "@lmstudio/lms-common";
import type {
  ClientToServerMessage,
  ServerToClientMessage,
  ServerTransportFactory,
} from "@lmstudio/lms-communication";
import { ServerTransport } from "@lmstudio/lms-communication";

export class GenericServerTransport extends ServerTransport {
  protected readonly logger;
  private closed = false;
  public constructor(
    onMessage: BufferedEvent<ClientToServerMessage>,
    onClose: BufferedEvent<void>,
    private readonly sendMessage: (message: ServerToClientMessage) => void,
    private readonly receivedMessage: (message: ClientToServerMessage) => void,
    private readonly errored: (error: any) => void,
    parentLogger?: LoggerInterface,
  ) {
    super();
    this.logger = new SimpleLogger("GenericServerTransport", parentLogger);
    onMessage.subscribe(message => {
      let parsed: ClientToServerMessage;
      try {
        parsed = this.parseIncomingMessage(message);
      } catch (error) {
        this.logger.warn("Received invalid message from client:", message);
        return;
      }
      this.receivedMessage(parsed);
    });
    onClose.subscribeOnce(() => {
      if (this.closed) {
        return;
      }
      this.closed = true;
      this.errored(new Error("Server closed the connection"));
    });
  }
  public static createFactory(
    onMessage: BufferedEvent<ClientToServerMessage>,
    onClose: BufferedEvent<void>,
    sendMessage: (message: ServerToClientMessage) => void,
  ): ServerTransportFactory {
    return (receivedMessage, errored, parentLogger) =>
      new GenericServerTransport(
        onMessage,
        onClose,
        sendMessage,
        receivedMessage,
        errored,
        parentLogger,
      );
  }
  public override sendViaTransport(message: ServerToClientMessage) {
    this.sendMessage(message);
  }
}
