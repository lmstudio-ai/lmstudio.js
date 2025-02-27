import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  type EmbeddingModelInfo,
  embeddingModelInfoSchema,
  type EmbeddingModelInstanceInfo,
  embeddingModelInstanceInfoSchema,
  modelSpecifierSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import {
  type BaseModelBackendInterface,
  createBaseModelBackendInterface,
} from "./baseModelBackendInterface.js";

export function createEmbeddingBackendInterface() {
  const baseModelBackendInterface = createBaseModelBackendInterface(
    embeddingModelInstanceInfoSchema,
    embeddingModelInfoSchema,
  ) as any as BaseModelBackendInterface<EmbeddingModelInstanceInfo, EmbeddingModelInfo>;
  return baseModelBackendInterface
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
    })
    .addRpcEndpoint("countTokens", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
        inputString: z.string(),
      }),
      returns: z.object({
        tokenCount: z.number().int(),
      }),
    });
}

export type EmbeddingPort = InferClientPort<typeof createEmbeddingBackendInterface>;
export type EmbeddingBackendInterface = ReturnType<typeof createEmbeddingBackendInterface>;
