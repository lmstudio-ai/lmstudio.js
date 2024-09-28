import {
  retrievalChunkingMethodSchema,
  type RetrievalChunkingMethod,
  type RetrievalFileProcessingStep,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { EmbeddingDynamicHandle } from "../embedding/EmbeddingDynamicHandle";
import { type FileHandle } from "../files/FileHandle";

/**
 * @public
 */
export interface RetrievalCallbacks {
  /**
   * Callback when the list of files to process is available. This list can be shorter than the list
   * passed in because some files may already have cached embeddings.
   *
   * @param filePathsToProcess - The list of files that will be processed.
   */
  onFileProcessList?: (filesToProcess: Array<FileHandle>) => void;
  /**
   * Callback when starting to process a file.
   *
   * @param file - The file being processed.
   * @param index - The index of the file in the list of files to process.
   * @param filePathsToProcess - The list of files that will be processed. This will be the same as
   * the list passed to `onFileProcessList`.
   */
  onFileProcessingStart?: (
    file: FileHandle,
    index: number,
    filesToProcess: Array<FileHandle>,
  ) => void;
  /**
   * Callback when processing a file has ended.
   *
   * @param file - The file that has been processed.
   * @param index - The index of the file in the list of files to process.
   * @param filePathsToProcess - The list of files that will be processed. This will be the same as
   * the list passed to `onFileProcessList`.
   */
  onFileProcessingEnd?: (
    file: FileHandle,
    index: number,
    filesToProcess: Array<FileHandle>,
  ) => void;
  /**
   * Callback when starting a processing step for a file. LM Studio process files one at a time and
   * processing each file involves multiple steps. This callback is called when starting a step.
   *
   * @param file - The file being processed.
   * @param step - The step being started.
   */
  onFileProcessingStepStart?: (file: FileHandle, step: RetrievalFileProcessingStep) => void;
  /**
   * Granular progress callback for a processing step.
   *
   * @param file - The file being processed.
   * @param step - The step being started.
   * @param progressInStep - The progress in the step for the step. This value is between 0 and 1.
   */
  onFileProcessingStepProgress?: (
    file: FileHandle,
    step: RetrievalFileProcessingStep,
    progressInStep: number,
  ) => void;
  /**
   * Callback when a processing step has ended.
   *
   * @param file - The file being processed.
   * @param step - The step that has ended.
   */
  onFileProcessingStepEnd?: (file: FileHandle, step: RetrievalFileProcessingStep) => void;
  /**
   * Callback when we have embedded all the files and are starting to search in the vector database.
   */
  onSearchingStart?: () => void;
  /**
   * Callback when we have finished searching in the vector database. The chunk usually will be
   * returned immediately after this callback.
   */
  onSearchingEnd?: () => void;
}
export const retrievalCallbacksSchema = z.object({
  onFileProcessList: z.function().optional(),
  onFileProcessingStart: z.function().optional(),
  onFileProcessingEnd: z.function().optional(),
  onFileProcessingStepStart: z.function().optional(),
  onFileProcessingStepProgress: z.function().optional(),
  onFileProcessingStepEnd: z.function().optional(),
  onSearchingStart: z.function().optional(),
  onSearchingEnd: z.function().optional(),
});

/**
 * @public
 * N.B.: onProgress returns progress as a float taking values from 0 to 1, 1 being completed
 */
export type RetrievalOpts = RetrievalCallbacks & {
  /**
   * The chunking method to use. By default uses recursive-v1 with chunk size 512 and chunk overlap
   * 100.
   */
  chunkingMethod?: RetrievalChunkingMethod;
  /**
   * The number of results to return.
   */
  limit?: number;
  /**
   * The embedding model to use.
   */
  embeddingModel?: EmbeddingDynamicHandle;
  /**
   * The path to the database.
   */
  databasePath?: string;
  /**
   * The signal to abort the retrieval
   */
  signal?: AbortSignal;
};
export const retrievalOptsSchema = z.object({
  chunkingMethod: retrievalChunkingMethodSchema.optional(),
  limit: z.number().optional(),
  embeddingModel: z.instanceof(EmbeddingDynamicHandle).optional(),
  databasePath: z.string().optional(),
  signal: z.instanceof(AbortSignal).optional(),
  ...retrievalCallbacksSchema.shape,
});
