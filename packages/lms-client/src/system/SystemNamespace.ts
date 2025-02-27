import {
  getCurrentStack,
  makePromise,
  SimpleLogger,
  type LoggerInterface,
  type Validator,
} from "@lmstudio/lms-common";
import { type SystemPort } from "@lmstudio/lms-external-backend-interfaces";
import {
  backendNotificationSchema,
  type BackendNotification,
  type EmbeddingModelInfo,
  type LLMInfo,
  type ModelInfo,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";

/** @public */
export class SystemNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    private readonly systemPort: SystemPort,
    private readonly validator: Validator,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("System", parentLogger);
  }
  /**
   * List all downloaded models.
   * @public
   */
  public async listDownloadedModels(): Promise<Array<ModelInfo>>;
  public async listDownloadedModels(domain: "llm"): Promise<Array<LLMInfo>>;
  public async listDownloadedModels(domain: "embedding"): Promise<Array<EmbeddingModelInfo>>;
  public async listDownloadedModels(domain?: "llm" | "embedding"): Promise<Array<ModelInfo>> {
    const stack = getCurrentStack(1);
    domain = this.validator.validateMethodParamOrThrow(
      "client.system",
      "listDownloadedModels",
      "domain",
      z.union([z.literal("llm"), z.literal("embedding"), z.undefined()]),
      domain,
      stack,
    );
    const models = await this.systemPort.callRpc("listDownloadedModels", undefined, {
      stack: getCurrentStack(1),
    });
    if (models === undefined) {
      return models;
    }
    return models.filter(model => model.type === domain);
  }
  public async whenDisconnected(): Promise<void> {
    const stack = getCurrentStack(1);
    const channel = this.systemPort.createChannel("alive", undefined, undefined, { stack });
    const { promise, resolve } = makePromise();
    channel.onError.subscribeOnce(resolve);
    channel.onClose.subscribeOnce(resolve);
    await promise;
  }
  public async notify(notification: BackendNotification) {
    const stack = getCurrentStack(1);
    notification = this.validator.validateMethodParamOrThrow(
      "client.system",
      "notify",
      "notification",
      backendNotificationSchema,
      notification,
      stack,
    );

    await this.systemPort.callRpc("notify", notification, { stack });
  }
  public async getLMStudioVersion(): Promise<{ version: string; build: number }> {
    const stack = getCurrentStack(1);
    return await this.systemPort.callRpc("version", undefined, { stack });
  }
}
