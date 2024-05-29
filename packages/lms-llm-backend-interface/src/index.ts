import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  llmChatHistorySchema,
  llmDescriptorSchema,
  llmLoadModelConfigSchema,
  llmModelSpecifierSchema,
  llmPredictionStatsSchema,
  llmResolvedLoadModelConfigSchema,
} from "@lmstudio/lms-shared-types";
import {
  llmPredictionConfigSchema,
  llmResolvedPredictionConfigSchema,
} from "@lmstudio/lms-shared-types/dist/llm/LLMPredictionConfig";
import { z } from "zod";

export function createLlmBackendInterface() {
  return new BackendInterface()
    .addRpcEndpoint("echo", {
      parameter: z.string(),
      returns: z.string(),
    })
    .addChannelEndpoint("loadModel", {
      creationParameter: z.object({
        path: z.string(),
        identifier: z.string().optional(),
        preset: z.string().optional(),
        config: llmLoadModelConfigSchema,
        noHup: z.boolean(),
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("progress"),
          progress: z.number(),
        }),
        z.object({
          type: z.literal("ambiguous"),
          paths: z.array(z.string()),
        }),
        z.object({
          type: z.literal("success"),
          instanceReference: z.string(),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("cancel"),
        }),
      ]),
    })
    .addRpcEndpoint("unloadModel", {
      parameter: z.object({
        identifier: z.string(),
      }),
      returns: z.void(),
    })
    .addChannelEndpoint("predict", {
      creationParameter: z.object({
        modelSpecifier: llmModelSpecifierSchema,
        history: llmChatHistorySchema,
        config: llmPredictionConfigSchema,
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("fragment"),
          fragment: z.string(),
        }),
        z.object({
          type: z.literal("success"),
          stats: llmPredictionStatsSchema,
          modelInfo: llmDescriptorSchema,
          loadModelConfig: llmResolvedLoadModelConfigSchema,
          predictionConfig: llmResolvedPredictionConfigSchema,
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("cancel"),
        }),
      ]),
    })
    .addRpcEndpoint("listLoaded", {
      parameter: z.undefined(),
      returns: z.array(llmDescriptorSchema),
    })
    .addRpcEndpoint("getModelInfo", {
      parameter: z.object({
        specifier: llmModelSpecifierSchema,
        throwIfNotFound: z.boolean(),
      }),
      returns: z
        .object({
          instanceReference: z.string(),
          descriptor: llmDescriptorSchema,
        })
        .optional(),
    });
}

export type LLMPort = InferClientPort<typeof createLlmBackendInterface>;
export type LLMBackendInterface = ReturnType<typeof createLlmBackendInterface>;
