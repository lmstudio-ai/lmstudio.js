import {
  retrievalChunkingMethodSchema,
  type RetrievalChunkingMethod,
  type RetrievalFileProcessingStep,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type EmbeddingDynamicHandle } from "../embedding/EmbeddingDynamicHandle";

export interface RetrievalCallbacks {
  /**
   * Callback when the list of files to process is available. This list can be shorter than the list
   * passed in because some files may already have cached embeddings.
   *
   * @param filePathsToProcess - The list of files that will be processed.
   */
  onFileProcessList?: (filePathsToProcess: Array<string>) => void;
  /**
   * Callback when starting to process a file.
   *
   * @param filePath - The path to the file being processed.
   * @param index - The index of the file in the list of files to process.
   * @param filePathsToProcess - The list of files that will be processed. This will be the same as
   * the list passed to `onFileProcessList`.
   */
  onFileProcessingStart?: (
    filePath: string,
    index: number,
    filePathsToProcess: Array<string>,
  ) => void;
  /**
   * Callback when processing a file has ended.
   *
   * @param filePath - The path to the file being processed.
   * @param index - The index of the file in the list of files to process.
   * @param filePathsToProcess - The list of files that will be processed. This will be the same as
   * the list passed to `onFileProcessList`.
   */
  onFileProcessingEnd?: (
    filePath: string,
    index: number,
    filePathsToProcess: Array<string>,
  ) => void;
  /**
   * Callback when starting a processing step for a file. LM Studio process files one at a time and
   * processing each file involves multiple steps. This callback is called when starting a step.
   *
   * @param filePath - The path of the file being processed.
   * @param step - The step being started.
   */
  onFileProcessingStepStart?: (filePath: string, step: RetrievalFileProcessingStep) => void;
  /**
   * Granular progress callback for a processing step.
   *
   * @param filePath - The path of the file being processed.
   * @param step - The step being started.
   * @param progressInStep - The progress in the step for the step. This value is between 0 and 1.
   */
  onFileProcessingStepProgress?: (
    filePath: string,
    step: RetrievalFileProcessingStep,
    progressInStep: number,
  ) => void;
  /**
   * Callback when a processing step has ended.
   *
   * @param filePath - The path of the file being processed.
   * @param step - The step that has ended.
   */
  onFileProcessingStepEnd?: (filePath: string, step: RetrievalFileProcessingStep) => void;
  /**
   * Callback when we have embedded all the files and are starting to search in the vector database.
   *
   * There is no matching `onSearchingEnd` callback because this is the last step, When the
   * searching is done, you will get the resulting chunks.
   */
  onSearchingStart?: () => void;
}
export const retrievalCallbacksSchema = z.object({
  onFileProcessList: z.function().optional(),
  onFileProcessingStart: z.function().optional(),
  onFileProcessingEnd: z.function().optional(),
  onFileProcessingStepStart: z.function().optional(),
  onFileProcessingStepProgress: z.function().optional(),
  onFileProcessingStepEnd: z.function().optional(),
  onSearchingStart: z.function().optional(),
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
  embeddingModel?: EmbeddingDynamicHandle | string;
  /**
   * The path to the database.
   */
  databasePath?: string;
};
export const retrievalOptsSchema = z.object({
  chunkingMethod: retrievalChunkingMethodSchema.optional(),
  limit: z.number().optional(),
  embeddingModel: z.string().optional(),
  databasePath: z.string().optional(),
  ...retrievalCallbacksSchema.shape,
});
