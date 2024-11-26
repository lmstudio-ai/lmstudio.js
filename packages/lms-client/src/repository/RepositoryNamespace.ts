import {
  getCurrentStack,
  makePromise,
  safeCallCallback,
  SimpleLogger,
  type LoggerInterface,
  type Validator,
} from "@lmstudio/lms-common";
import { type RepositoryPort } from "@lmstudio/lms-external-backend-interfaces";
import {
  modelSearchOptsSchema,
  type DownloadProgressUpdate,
  type ModelSearchOpts,
} from "@lmstudio/lms-shared-types";
import { z, type ZodSchema } from "zod";
import { ModelSearchResultEntry } from "./ModelSearchResultEntry.js";

/** @public */
export interface DownloadArtifactOpts {
  owner: string;
  name: string;
  revisionNumber: number;
  /**
   * Where to save the artifact.
   */
  path: string;
  onProgress?: (update: DownloadProgressUpdate) => void;
  onStartFinalizing?: () => void;
  signal?: AbortSignal;
}
const downloadArtifactOptsSchema = z.object({
  owner: z.string(),
  name: z.string(),
  revisionNumber: z.number(),
  path: z.string(),
  onProgress: z.function().optional(),
  onStartFinalizing: z.function().optional(),
  signal: z.instanceof(AbortSignal).optional(),
}) as ZodSchema<DownloadArtifactOpts>;

/** @public */
export class RepositoryNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly validator: Validator,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("Repository", parentLogger);
  }

  public async searchModels(opts: ModelSearchOpts): Promise<Array<ModelSearchResultEntry>> {
    const stack = getCurrentStack(1);
    opts = this.validator.validateMethodParamOrThrow(
      "repository",
      "search",
      "opts",
      modelSearchOptsSchema,
      opts,
      stack,
    );
    const { results } = await this.repositoryPort.callRpc("searchModels", { opts }, { stack });
    return results.map(
      data => new ModelSearchResultEntry(this.repositoryPort, this.validator, this.logger, data),
    );
  }

  public async downloadArtifact(opts: DownloadArtifactOpts) {
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamOrThrow(
      "client.repository",
      "downloadArtifact",
      "opts",
      downloadArtifactOptsSchema,
      opts,
      stack,
    );
    const { owner, name, revisionNumber, path, onProgress, onStartFinalizing, signal } = opts;
    const { promise, resolve, reject } = makePromise<void>();
    const channel = this.repositoryPort.createChannel(
      "downloadArtifact",
      { artifactOwner: owner, artifactName: name, revisionNumber, path },
      message => {
        switch (message.type) {
          case "downloadProgress": {
            safeCallCallback(this.logger, "onProgress", opts.onProgress, [message.update]);
            break;
          }
          case "startFinalizing": {
            safeCallCallback(this.logger, "onStartFinalizing", opts.onStartFinalizing, []);
            break;
          }
          case "success": {
            resolve();
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
    channel.onClose.subscribeOnce(() => {
      if (opts.signal?.aborted) {
        reject(opts.signal.reason);
      } else {
        reject(new Error("Channel closed unexpectedly."));
      }
    });
    const abortListener = () => {
      channel.send({ type: "cancel" });
    };
    opts.signal?.addEventListener("abort", abortListener);
    promise.finally(() => {
      opts.signal?.removeEventListener("abort", abortListener);
    });
    return await promise;
  }

  public async push(path: string): Promise<void> {
    const stack = getCurrentStack(1);
    path = this.validator.validateMethodParamOrThrow(
      "repository",
      "push",
      "path",
      z.string(),
      path,
      stack,
    );
    await this.repositoryPort.callRpc("push", { path }, { stack });
  }
}
