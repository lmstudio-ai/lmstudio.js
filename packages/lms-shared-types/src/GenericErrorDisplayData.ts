import { z } from "zod";
import { modelDomainTypeSchema } from "./ModelDomainType.js";
import { modelQuerySchema } from "./ModelSpecifier.js";

export const genericErrorDisplayDataSchema = [
  z.object({
    code: z.literal("generic.specificModelUnloaded"),
  }),
  z.object({
    code: z.literal("generic.noModelMatchingQuery"),
    query: modelQuerySchema,
    loadedModelsSample: z.array(z.string()),
    totalLoadedModels: z.number().int(),
  }),
  z.object({
    code: z.literal("generic.pathNotFound"),
    path: z.string(),
    availablePathsSample: z.array(z.string()),
    totalModels: z.number().int(),
  }),
  z.object({
    code: z.literal("generic.identifierNotFound"),
    identifier: z.string(),
    loadedModelsSample: z.array(z.string()),
    totalLoadedModels: z.number().int(),
  }),
  z.object({
    code: z.literal("generic.domainMismatch"),
    path: z.string(),
    actualDomain: modelDomainTypeSchema,
    expectedDomain: modelDomainTypeSchema,
  }),
] as const;
