import {
  getCurrentStack,
  safeCallCallback,
  SimpleLogger,
  type LoggerInterface,
  type Validator,
} from "@lmstudio/lms-common";
import { type RetrievalPort } from "@lmstudio/lms-external-backend-interfaces";
import { retrievalSchematics } from "@lmstudio/lms-kv-config";
import { type KVConfig } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type EmbeddingNamespace } from "../embedding/EmbeddingNamespace.js";
import { FileHandle } from "../files/FileHandle.js";
import { retrievalOptsSchema, type RetrievalOpts } from "./RetrievalOpts.js";
import { type RetrievalResult, type RetrievalResultEntry } from "./RetrievalResult.js";

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
    files: Array<FileHandle>,
    opts: RetrievalOpts = {},
  ): Promise<RetrievalResult> {
    const logger = new SimpleLogger("Retrieve", this.logger);
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamsOrThrow(
      "client.retrieval",
      "retrieve",
      ["query", "filePaths", "opts"],
      [z.string(), z.array(z.instanceof(FileHandle)), retrievalOptsSchema],
      [query, files, opts],
      stack,
    );

    if (opts.embeddingModel === undefined) {
      throw new Error("Embedding model currently is required.");
    }

    const resolveFileIndex = (index: number) => {
      const file = files[index];
      if (file === undefined) {
        throw new Error(`File not found: ${index}`);
      }
      return file;
    };
    const resolveFileIndices = (indices: Array<number>) => {
      return indices.map(resolveFileIndex);
    };

    const kvConfig: KVConfig = retrievalSchematics.buildPartialConfig({
      chunkingMethod: opts.chunkingMethod,
      databaseFile: opts.databasePath,
      embeddingModel: (await opts.embeddingModel.getModelInfo())?.identifier,
      limit: opts.limit,
    });

    let filesToProcess: Array<FileHandle> | null;

    return await new Promise<RetrievalResult>((resolve, reject) => {
      const channel = this.retrievalPort.createChannel(
        "retrieve",
        { query, fileIdentifiers: files.map(file => file.identifier), config: kvConfig },
        message => {
          switch (message.type) {
            case "onFileProcessList":
              filesToProcess = resolveFileIndices(message.indices);
              safeCallCallback(logger, "onFileProcessList", opts.onFileProcessList, [
                filesToProcess,
              ]);
              break;
            case "onFileProcessingStart": {
              if (filesToProcess === null) {
                throw new Error("onFileProcessList must be called before onFileProcessingStart");
              }
              const file = resolveFileIndex(message.index);
              safeCallCallback(logger, "onFileProcessingStart", opts.onFileProcessingStart, [
                file,
                filesToProcess.indexOf(file),
                filesToProcess,
              ]);
              break;
            }
            case "onFileProcessingEnd": {
              if (filesToProcess === null) {
                throw new Error("onFileProcessList must be called before onFileProcessingEnd");
              }
              const file = resolveFileIndex(message.index);
              safeCallCallback(logger, "onFileProcessingEnd", opts.onFileProcessingEnd, [
                file,
                filesToProcess.indexOf(file),
                filesToProcess,
              ]);
              break;
            }
            case "onFileProcessingStepStart":
              safeCallCallback(
                logger,
                "onFileProcessingStepStart",
                opts.onFileProcessingStepStart,
                [resolveFileIndex(message.index), message.step],
              );
              break;
            case "onFileProcessingStepProgress":
              safeCallCallback(
                logger,
                "onFileProcessingStepProgress",
                opts.onFileProcessingStepProgress,
                [resolveFileIndex(message.index), message.step, message.progress],
              );
              break;
            case "onFileProcessingStepEnd":
              safeCallCallback(logger, "onFileProcessingStepEnd", opts.onFileProcessingStepEnd, [
                resolveFileIndex(message.index),
                message.step,
              ]);
              break;
            case "onSearchingStart":
              safeCallCallback(logger, "onSearchingStart", opts.onSearchingStart, []);
              break;
            case "onSearchingEnd":
              safeCallCallback(logger, "onSearchingEnd", opts.onSearchingEnd, []);
              break;
            case "result": {
              resolve({
                entries: message.result.entries.map(
                  entry =>
                    ({
                      content: entry.content,
                      score: entry.score,
                      source: files[entry.sourceIndex],
                    }) satisfies RetrievalResultEntry,
                ),
              });
              break;
            }
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
