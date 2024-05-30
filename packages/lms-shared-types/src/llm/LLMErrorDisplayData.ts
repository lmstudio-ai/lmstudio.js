import { z } from "zod";

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
] as const;
