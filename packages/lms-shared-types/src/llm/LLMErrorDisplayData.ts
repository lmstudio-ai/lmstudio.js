import { z } from "zod";

export const llmErrorDisplayDataSchema = [
  z.object({
    code: z.literal("llm.pathNotFound"),
    path: z.string(),
    availablePathsSample: z.array(z.string()),
    totalModels: z.number(),
  }),
] as const;
