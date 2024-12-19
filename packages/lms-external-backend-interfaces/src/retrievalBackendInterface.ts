import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  internalRetrievalResultSchema,
  kvConfigSchema,
  retrievalFileProcessingStepSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createRetrievalBackendInterface() {
  return new BackendInterface().addChannelEndpoint("retrieve", {
    creationParameter: z.object({
      query: z.string(),
      fileIdentifiers: z.array(z.string()),
      config: kvConfigSchema,
    }),
    toServerPacket: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("stop"),
      }),
    ]),
    toClientPacket: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("onFileProcessList"),
        indices: z.array(z.number().int()),
      }),
      z.object({
        type: z.literal("onFileProcessingStart"),
        index: z.number().int(),
      }),
      z.object({
        type: z.literal("onFileProcessingEnd"),
        index: z.number().int(),
      }),
      z.object({
        type: z.literal("onFileProcessingStepStart"),
        index: z.number().int(),
        step: retrievalFileProcessingStepSchema,
      }),
      z.object({
        type: z.literal("onFileProcessingStepProgress"),
        index: z.number().int(),
        step: retrievalFileProcessingStepSchema,
        progress: z.number(),
      }),
      z.object({
        type: z.literal("onFileProcessingStepEnd"),
        index: z.number().int(),
        step: retrievalFileProcessingStepSchema,
      }),
      z.object({
        type: z.literal("onSearchingStart"),
      }),
      z.object({
        type: z.literal("onSearchingEnd"),
      }),
      z.object({
        type: z.literal("result"),
        result: internalRetrievalResultSchema,
      }),
    ]),
  });
}

export type RetrievalBackendInterface = ReturnType<typeof createRetrievalBackendInterface>;
export type RetrievalPort = InferClientPort<typeof createRetrievalBackendInterface>;
