import { z } from "zod";
import { modelQuerySchema } from "./ModelSpecifier.js";

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
  z.object({
    code: z.literal("generic.pathNotFound"),
    path: z.string(),
    availablePathsSample: z.array(z.string()),
    totalModels: z.number(),
  }),
  z.object({
    code: z.literal("generic.identifierNotFound"),
    identifier: z.string(),
    loadedModelsSample: z.array(z.string()),
    totalLoadedModels: z.number(),
  }),
] as const;
