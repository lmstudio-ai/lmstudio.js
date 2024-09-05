import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  kvConfigSchema,
  retrievalChunkSchema,
  retrievalFileProcessingStepSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createRetrievalBackendInterface() {
  return new BackendInterface().addChannelEndpoint("retrieve", {
    creationParameter: z.object({
      query: z.string(),
      filePaths: z.array(z.string()),
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
        filePaths: z.array(z.string()),
      }),
      z.object({
        type: z.literal("onFileProcessingStart"),
        filePath: z.string(),
        index: z.number(),
        filePaths: z.array(z.string()),
      }),
      z.object({
        type: z.literal("onFileProcessingEnd"),
        filePath: z.string(),
        index: z.number(),
        filePaths: z.array(z.string()),
      }),
      z.object({
        type: z.literal("onFileProcessingStepStart"),
        filePath: z.string(),
        step: retrievalFileProcessingStepSchema,
      }),
      z.object({
        type: z.literal("onFileProcessingStepProgress"),
        filePath: z.string(),
        step: retrievalFileProcessingStepSchema,
        progress: z.number(),
      }),
      z.object({
        type: z.literal("onFileProcessingStepEnd"),
        filePath: z.string(),
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
        chunks: z.array(retrievalChunkSchema),
      }),
    ]),
  });
}

export type RetrievalBackendInterface = ReturnType<typeof createRetrievalBackendInterface>;
export type RetrievalPort = InferClientPort<typeof createRetrievalBackendInterface>;
