import { SimpleLogger } from "@lmstudio/lms-common";
import type { BackendInterface } from "@lmstudio/lms-communication";
import type { IpcMain, IpcMainEvent, MessagePortMain } from "electron";
import { type Context, type ContextCreator } from "./Authenticator";
import { IpcServerTransport } from "./IpcServerTransport";
import { ServerPort } from "./ServerPort";

export abstract class IpcServer<TContext extends Context> {
  protected readonly logger: SimpleLogger;
  public constructor(
    protected readonly backendInterface: BackendInterface<TContext>,
    ipcMain: IpcMain,
    channel: string,
    parentLogger?: SimpleLogger,
  ) {
    this.logger = new SimpleLogger("IpcServer", parentLogger);
    ipcMain.on(channel, (event, ...args) => this.onConnection(event, ...args));
  }
  protected createServerPort(contextCreator: ContextCreator<TContext>, port: MessagePortMain) {
    return new ServerPort(
      this.backendInterface,
      contextCreator,
      IpcServerTransport.createFactory(port),
    );
  }
  protected abstract onConnection(event: IpcMainEvent, ...args: Array<unknown>): Promise<void>;
}
