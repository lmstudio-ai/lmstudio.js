import { z } from "zod";
import { modelQuerySchema } from "./ModelSpecifier";

export const genericErrorDisplayDataSchema = [
  z.object({
    code: z.literal("generic.specificModelUnloaded"),
  }),
  z.object({
    code: z.literal("generic.noModelMatchingQuery"),
    query: modelQuerySchema,
    loadedModelsSample: z.array(z.string()),
    totalLoadedModels: z.number(),
  }),
] as const;
