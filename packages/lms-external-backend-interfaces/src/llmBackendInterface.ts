import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  kvConfigSchema,
  kvConfigStackSchema,
  llmApplyPromptTemplateOptsSchema,
  llmContextSchema,
  llmPredictionStatsSchema,
  modelDescriptorSchema,
  modelSpecifierSchema,
  processorInputContextSchema,
  processorInputMessageSchema,
  promptPreprocessorUpdateSchema,
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
    .addChannelEndpoint("registerPromptPreprocessor", {
      creationParameter: z.object({
        identifier: z.string(),
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("preprocess"),
          taskId: z.string(),
          context: processorInputContextSchema,
          userInput: processorInputMessageSchema,
        }),
        z.object({
          type: z.literal("cancel"),
          taskId: z.string(),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("update"),
          taskId: z.string(),
          update: promptPreprocessorUpdateSchema,
        }),
        z.object({
          type: z.literal("complete"),
          taskId: z.string(),
          processed: processorInputMessageSchema,
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
