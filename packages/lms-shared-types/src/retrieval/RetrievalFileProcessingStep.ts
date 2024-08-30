import { z } from "zod";

/**
 * @public
 */
export type RetrievalFileProcessingStep = "querying" | "loading" | "chunking" | "embedding";
export const retrievalFileProcessingStepSchema = z.enum([
  "querying",
  "loading",
  "chunking",
  "embedding",
]);
