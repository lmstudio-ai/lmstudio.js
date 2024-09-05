import { z } from "zod";

/**
 * @public
 */
export type RetrievalFileProcessingStep = "loading" | "chunking" | "embedding";
export const retrievalFileProcessingStepSchema = z.enum(["loading", "chunking", "embedding"]);
