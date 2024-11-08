import { z } from "zod";

/**
 * @public
 */
export type ModelDomainType = "llm" | "embedding" | "imageGen" | "transcription" | "tts";
export const modelDomainTypeSchema = z.enum([
  "llm",
  "embedding",
  "imageGen",
  "transcription",
  "tts",
]);
