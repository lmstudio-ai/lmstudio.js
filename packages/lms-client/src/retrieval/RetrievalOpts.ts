import {
  retrievalChunkingMethodSchema,
  type RetrievalChunkingMethod,
  type RetrievalFileProcessingStep,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type EmbeddingDynamicHandle } from "../embedding/EmbeddingDynamicHandle";

/**
 * @public
 * N.B.: onProgress returns progress as a float taking values from 0 to 1, 1 being completed
 */
export interface RetrievalOpts {
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
   * @param filename - The name of the file being processed.
   * @param step - The step being started.
   */
  onFileProcessingStepStart?: (filename: string, step: RetrievalFileProcessingStep) => void;
  /**
   * Granular progress callback for a processing step.
   *
   * @param filename - The name of the file being processed.
   * @param step - The step being started.
   * @param progressInStep - The progress in the step for the step. This value is between 0 and 1.
   */
  onFileProcessingStepProgress?: (
    filename: string,
    step: RetrievalFileProcessingStep,
    progressInStep: number,
  ) => void;
  /**
   * Callback when a processing step has ended.
   *
   * @param filename - The name of the file being processed.
   * @param step - The step that has ended.
   */
  onFileProcessingStepEnd?: (filename: string, step: RetrievalFileProcessingStep) => void;
}
export const retrievalOptsSchema = z.object({
  chunkingMethod: retrievalChunkingMethodSchema.optional(),
  limit: z.number().optional(),
  embeddingModel: z.string().optional(),
  databasePath: z.string().optional(),
  onFileProcessList: z.function().optional(),
  onFileProcessingStart: z.function().optional(),
  onFileProcessingEnd: z.function().optional(),
  onFileProcessingStepStart: z.function().optional(),
  onFileProcessingStepProgress: z.function().optional(),
  onFileProcessingStepEnd: z.function().optional(),
});
