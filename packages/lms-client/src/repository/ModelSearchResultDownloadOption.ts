import {
  getCurrentStack,
  makePromise,
  safeCallCallback,
  type SimpleLogger,
  type Validator,
} from "@lmstudio/lms-common";
import { type RepositoryPort } from "@lmstudio/lms-external-backend-interfaces";
import { type ModelSearchResultDownloadOptionData } from "@lmstudio/lms-shared-types";
import { type ModelSearchResultDownloadOptionFitEstimation } from "@lmstudio/lms-shared-types/dist/repository/ModelSearch";
import { z } from "zod";

export interface DownloadOpts {
  onProgress?: (downloadedBytes: number, totalBytes: number) => void;
  onStartFinalizing?: () => void;
  signal?: AbortSignal;
}
const downloadOptsSchema = z.object({
  onProgress: z.function().optional(),
  onStartFinalizing: z.function().optional(),
  signal: z.instanceof(AbortSignal).optional(),
});

/** @public */
export class ModelSearchResultDownloadOption {
  public readonly quantization?: string;
  public readonly name: string;
  public readonly sizeBytes: number;
  public readonly fitEstimation?: ModelSearchResultDownloadOptionFitEstimation;
  public readonly indexedModelIdentifier: string;
  /** @internal */
  public constructor(
    /** @internal */
    private readonly repositoryPort: RepositoryPort,
    /** @internal */
    private readonly validator: Validator,
    private readonly logger: SimpleLogger,
    private readonly data: ModelSearchResultDownloadOptionData,
  ) {
    this.quantization = data.quantization;
    this.name = data.name;
    this.sizeBytes = data.sizeBytes;
    this.fitEstimation = this.data.fitEstimation;
    this.indexedModelIdentifier = this.data.indexedModelIdentifier;
  }
  public isRecommended() {
    return this.data.recommended ?? false;
  }
  public async download(opts: DownloadOpts = {}) {
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamOrThrow(
      "ModelSearchResultDownloadOption",
      "download",
      "opts",
      downloadOptsSchema,
      opts,
    );
    const { promise, resolve, reject } = makePromise<void>();
    const channel = this.repositoryPort.createChannel(
      "downloadModel",
      {
        downloadIdentifier: this.data.downloadIdentifier,
      },
      message => {
        switch (message.type) {
          case "downloadProgress": {
            safeCallCallback(this.logger, "onProgress", opts.onProgress, [
              message.downloadedBytes,
              message.totalBytes,
            ]);
            break;
          }
          case "startFinalizing": {
            safeCallCallback(this.logger, "onStartFinalizing", opts.onStartFinalizing, []);
            break;
          }
          default: {
            const exhaustiveCheck: never = message;
            throw new Error(`Unexpected message type: ${exhaustiveCheck}`);
          }
        }
      },
      { stack },
    );
    channel.onError.subscribeOnce(reject);
    channel.onClose.subscribeOnce(resolve);
    const abortListener = () => {
      channel.send({ type: "cancel" });
    };
    opts.signal?.addEventListener("abort", abortListener);
    promise.finally(() => {
      opts.signal?.removeEventListener("abort", abortListener);
    });
    await promise;
  }
}
