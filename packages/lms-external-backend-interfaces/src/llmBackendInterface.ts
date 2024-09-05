import { createResultSchema } from "@lmstudio/lms-common";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  chatHistoryDataSchema,
  chatMessageDataSchema,
  kvConfigSchema,
  kvConfigStackSchema,
  llmApplyPromptTemplateOptsSchema,
  llmContextSchema,
  llmPredictionStatsSchema,
  modelDescriptorSchema,
  modelSpecifierSchema,
  preprocessorUpdateSchema,
  serializedLMSExtendedErrorSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { createBaseModelBackendInterface } from "./baseModelBackendInterface";

export function createLlmBackendInterface() {
  return createBaseModelBackendInterface()
    .addChannelEndpoint("predict", {
      creationParameter: z.object({
        modelSpecifier: modelSpecifierSchema,
        context: llmContextSchema,
        predictionConfigStack: kvConfigStackSchema,
        ignoreServerSessionConfig: z.boolean().optional(),
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("fragment"),
          fragment: z.string(),
        }),
        z.object({
          type: z.literal("promptProcessingProgress"),
          progress: z.number(),
        }),
        z.object({
          type: z.literal("success"),
          stats: llmPredictionStatsSchema,
          modelInfo: modelDescriptorSchema,
          loadModelConfig: kvConfigSchema,
          predictionConfig: kvConfigSchema,
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("cancel"),
        }),
      ]),
    })
    .addRpcEndpoint("applyPromptTemplate", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
        context: llmContextSchema,
        predictionConfigStack: kvConfigStackSchema,
        opts: llmApplyPromptTemplateOptsSchema,
      }),
      returns: z.object({
        formatted: z.string(),
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
        tokenCount: z.number(),
      }),
    })
    .addChannelEndpoint("registerPreprocessor", {
      creationParameter: z.object({
        identifier: z.string(),
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("preprocess"),
          taskId: z.string(),
          userMessage: chatMessageDataSchema,
        }),
        z.object({
          type: z.literal("cancel"),
          taskId: z.string(),
        }),
        z.object({
          type: z.literal("getContextResult"),
          taskId: z.string(),
          requestId: z.string(),
          result: createResultSchema(chatHistoryDataSchema),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("update"),
          taskId: z.string(),
          update: preprocessorUpdateSchema,
        }),
        z.object({
          type: z.literal("complete"),
          taskId: z.string(),
          processed: chatMessageDataSchema,
        }),
        z.object({
          type: z.literal("getContext"),
          taskId: z.string(),
          requestId: z.string(),
        }),
        z.object({
          type: z.literal("error"),
          taskId: z.string(),
          error: serializedLMSExtendedErrorSchema,
        }),
      ]),
    });
}

export type LLMPort = InferClientPort<typeof createLlmBackendInterface>;
export type LLMBackendInterface = ReturnType<typeof createLlmBackendInterface>;
