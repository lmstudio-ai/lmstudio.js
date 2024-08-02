import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { modelSpecifierSchema } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { createBaseModelBackendInterface } from "./baseModelBackendInterface";

export function createEmbeddingBackendInterface() {
  return createBaseModelBackendInterface().addRpcEndpoint("embedString", {
    parameter: z.object({
      modelSpecifier: modelSpecifierSchema,
      inputString: z.string(),
    }),
    returns: z.object({
      embedding: z.array(z.number()),
    }),
  });
}

export type EmbeddingPort = InferClientPort<typeof createEmbeddingBackendInterface>;
export type EmbeddingBackendInterface = ReturnType<typeof createEmbeddingBackendInterface>;
