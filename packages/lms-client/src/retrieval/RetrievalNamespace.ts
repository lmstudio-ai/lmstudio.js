import {
  getCurrentStack,
  safeCallCallback,
  SimpleLogger,
  type LoggerInterface,
  type Validator,
} from "@lmstudio/lms-common";
import { type RetrievalPort } from "@lmstudio/lms-external-backend-interfaces";
import { retrievalSchematics } from "@lmstudio/lms-kv-config";
import { type KVConfig, type RetrievalChunk } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type EmbeddingNamespace } from "../embedding/EmbeddingNamespace";
import { retrievalOptsSchema, type RetrievalOpts } from "./RetrievalOpts";

/** @public */
export class RetrievalNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    private readonly retrievalPort: RetrievalPort,
    private readonly validator: Validator,
    private readonly embeddingNamespace: EmbeddingNamespace,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("Diagnostics", parentLogger);
  }
  public async retrieve(
    query: string,
    filePaths: Array<string>,
    opts: RetrievalOpts = {},
  ): Promise<Array<RetrievalChunk>> {
    const logger = new SimpleLogger("Retrieve", this.logger);
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamsOrThrow(
      "client.retrieval",
      "retrieve",
      ["query", "filePaths", "opts"],
      [z.string(), z.array(z.string()), retrievalOptsSchema],
      [query, filePaths, opts],
      stack,
    );

    if (opts.embeddingModel === undefined) {
      throw new Error("Embedding model currently is required.");
    }

    const kvConfig: KVConfig = retrievalSchematics.buildPartialConfig({
      chunkingMethod: opts.chunkingMethod,
      databaseFile: opts.databasePath,
      embeddingModel: (await opts.embeddingModel.getModelInfo())?.identifier,
      limit: opts.limit,
    });

    return await new Promise<Array<RetrievalChunk>>((resolve, reject) => {
      const channel = this.retrievalPort.createChannel(
        "retrieve",
        { query, filePaths, config: kvConfig },
        message => {
          switch (message.type) {
            case "onFileProcessList":
              safeCallCallback(logger, "onFileProcessList", opts.onFileProcessList, [
                message.filePaths,
              ]);
              break;
            case "onFileProcessingStart":
              safeCallCallback(logger, "onFileProcessingStart", opts.onFileProcessingStart, [
                message.filePath,
                message.index,
                message.filePaths,
              ]);
              break;
            case "onFileProcessingEnd":
              safeCallCallback(logger, "onFileProcessingEnd", opts.onFileProcessingEnd, [
                message.filePath,
                message.index,
                message.filePaths,
              ]);
              break;
            case "onFileProcessingStepStart":
              safeCallCallback(
                logger,
                "onFileProcessingStepStart",
                opts.onFileProcessingStepStart,
                [message.filePath, message.step],
              );
              break;
            case "onFileProcessingStepProgress":
              safeCallCallback(
                logger,
                "onFileProcessingStepProgress",
                opts.onFileProcessingStepProgress,
                [message.filePath, message.step, message.progress],
              );
              break;
            case "onFileProcessingStepEnd":
              safeCallCallback(logger, "onFileProcessingStepEnd", opts.onFileProcessingStepEnd, [
                message.filePath,
                message.step,
              ]);
              break;
            case "onSearchingStart":
              safeCallCallback(logger, "onSearchingStart", opts.onSearchingStart, []);
              break;
            case "onSearchingEnd":
              safeCallCallback(logger, "onSearchingEnd", opts.onSearchingEnd, []);
              break;
            case "result":
              resolve(message.chunks);
              break;
          }
        },
      );
      opts.signal?.addEventListener("abort", () => {
        reject(opts.signal!.reason);
        channel.send({ type: "stop" });
      });
      channel.onError.subscribeOnce(reject);
    });
  }
}
