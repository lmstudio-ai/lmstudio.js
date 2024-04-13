import { SimpleLogger, type LoggerInterface } from "@lmstudio/lms-common";
import type {
  ClientToServerMessage,
  ServerToClientMessage,
  ServerTransportFactory,
} from "@lmstudio/lms-communication";
import { ServerTransport } from "@lmstudio/lms-communication";
import type { WebSocket } from "ws";

export class WsServerTransport extends ServerTransport {
  protected readonly logger: SimpleLogger;
  private closed = false;

  public constructor(
    private readonly ws: WebSocket,
    private readonly receivedMessage: (message: ClientToServerMessage) => void,
    private readonly errored: (error: any) => void,
    parentLogger?: LoggerInterface,
  ) {
    super();
    this.logger = new SimpleLogger("WsServerTransport", parentLogger);
    // const socket = (ws as any)._socket as Socket;
    // socket.setKeepAlive(true, KEEP_ALIVE_INTERVAL);
    // socket.setTimeout(KEEP_ALIVE_TIMEOUT);
    this.ws.addEventListener("message", event => {
      let message;
      try {
        message = JSON.parse(event.data.toString("utf8"));
      } catch (error) {
        this.logger.warn("Received invalid JSON message from client:", event.data);
        return;
      }
      let parsed: ClientToServerMessage;
      try {
        parsed = this.parseIncomingMessage(message);
      } catch (error) {
        this.logger.warn("Received invalid message from client:", message);
        return;
      }
      this.receivedMessage(parsed);
    });
    this.ws.addEventListener("error", error => {
      if (this.closed) {
        return;
      }
      this.closed = true;
      this.logger.warn("WebSocket error:", error);
      try {
        this.ws?.close();
      } catch (error) {
        // Ignore
      }
      this.errored(error);
    });
    this.ws.addEventListener("close", () => {
      if (this.closed) {
        return;
      }
      this.closed = true;
      this.errored(new Error("WebSocket closed by the client"));
    });
    // socket.once("timeout", () => {
    //   if (this.closed) {
    //     return;
    //   }
    //   this.closed = true;
    //   logger.warn("Websocket timed out");
    //   try {
    //     this.ws?.close();
    //   } catch (error) {
    //     // Ignore
    //   }
    //   this.errored(new Error("WebSocket timed out"));
    // });
  }
  public static createFactory(ws: WebSocket): ServerTransportFactory {
    return (receivedMessage, errored, parentLogger) =>
      new WsServerTransport(ws, receivedMessage, errored, parentLogger);
  }
  public override sendViaTransport(message: ServerToClientMessage) {
    this.ws!.send(JSON.stringify(message));
  }
}
