import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  embeddingModelInfoSchema,
  embeddingModelInstanceInfoSchema,
  modelSpecifierSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { createBaseModelBackendInterface } from "./baseModelBackendInterface.js";

export function createEmbeddingBackendInterface() {
  return createBaseModelBackendInterface(embeddingModelInstanceInfoSchema, embeddingModelInfoSchema)
    .addRpcEndpoint("embedString", {
      parameter: z.object({
        modelSpecifier: modelSpecifierSchema,
        inputString: z.string(),
      }),
      returns: z.object({
        embedding: z.array(z.number()),
      }),
    })
    .addRpcEndpoint("tokenize", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
        inputString: z.string(),
      }),
      returns: z.object({
        tokens: z.array(z.number()),
      }),
    });
}

export type EmbeddingPort = InferClientPort<typeof createEmbeddingBackendInterface>;
export type EmbeddingBackendInterface = ReturnType<typeof createEmbeddingBackendInterface>;
