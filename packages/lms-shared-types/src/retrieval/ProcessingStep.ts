import { z } from "zod";

/**
 * @public
 */
export type ProcessingStep = "querying" | "loading" | "chunking" | "embedding";
export const processingStepSchema = z.enum(["querying", "loading", "chunking", "embedding"]);
