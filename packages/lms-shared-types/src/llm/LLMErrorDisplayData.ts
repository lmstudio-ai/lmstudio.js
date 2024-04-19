import { z } from "zod";
import { llmModelQuerySchema } from "./LLMModelSpecifier";

export const llmErrorDisplayDataSchema = [
  z.object({
    code: z.literal("llm.pathNotFound"),
    path: z.string(),
    availablePathsSample: z.array(z.string()),
    totalModels: z.number(),
  }),
  z.object({
    code: z.literal("llm.identifierNotFound"),
    identifier: z.string(),
    loadedModelsSample: z.array(z.string()),
    totalLoadedModels: z.number(),
  }),
  z.object({
    code: z.literal("llm.specificModelUnloaded"),
  }),
  z.object({
    code: z.literal("llm.noModelMatchingQuery"),
    query: llmModelQuerySchema,
    loadedModelsSample: z.array(z.string()),
    totalLoadedModels: z.number(),
  }),
] as const;
