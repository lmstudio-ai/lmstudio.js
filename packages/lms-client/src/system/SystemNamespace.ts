import { getCurrentStack, SimpleLogger, type LoggerInterface } from "@lmstudio/lms-common";
import { type DownloadedModel } from "@lmstudio/lms-shared-types";
import { type SystemPort } from "@lmstudio/lms-system-backend-interface";

/** @public */
export class SystemNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    private readonly systemPort: SystemPort,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("System", parentLogger);
  }
  /**
   * TODO: Needs documentation.
   * @public
   */
  public async listDownloadedModels(): Promise<Array<DownloadedModel>> {
    return this.systemPort.callRpc("listDownloadedModels", undefined, {
      stack: getCurrentStack(1),
    });
  }
}
