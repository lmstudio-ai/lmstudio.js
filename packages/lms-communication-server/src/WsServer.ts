import { SimpleLogger } from "@lmstudio/lms-common";
import type { BackendInterface } from "@lmstudio/lms-communication";
import type { Server } from "http";
import { parse } from "url";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

export abstract class WsServer<TContext> {
  protected readonly logger: SimpleLogger;
  private readonly wss: WebSocketServer;
  public constructor(
    protected readonly backendInterface: BackendInterface<TContext>,
    server: Server,
    pathName: string,
    parentLogger?: SimpleLogger,
  ) {
    this.logger = new SimpleLogger("WsServer", parentLogger);
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on("connection", ws => this.onConnection(ws));
    server.on("upgrade", (request, socket, head) => {
      const { pathname } = parse(request.url ?? "");
      if (pathname === `/${pathName}`) {
        socket.on("error", error => {
          this.logger.warn("Socket error:", error);
        });
        this.wss.handleUpgrade(request, socket, head, ws => {
          this.wss.emit("connection", ws, request);
        });
      }
    });
  }
  protected abstract onConnection(ws: WebSocket): void;
}
