import { z } from "zod";
import { type ProcessingStep, processingStepSchema } from "./ProcessingStep";

/**
 * @public
 * N.B.: onProgress returns progress as a float taking values from 0 to 1, 1 being completed
 */
export interface RetrievalConfig {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  onProgress: (filename: string, step: ProcessingStep, progress: number) => void;
}
export const retrievalConfigSchema = z.object({
  chunkSize: z.number(),
  chunkOverlap: z.number(),
  topK: z.number(),
  onProgress: z.function().args(z.string(), processingStepSchema, z.number()).returns(z.void()),
});
