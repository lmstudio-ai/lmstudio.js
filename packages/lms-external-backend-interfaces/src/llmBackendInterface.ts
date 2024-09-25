import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  chatHistoryDataSchema,
  chatMessageDataSchema,
  kvConfigSchema,
  kvConfigStackSchema,
  llmApplyPromptTemplateOptsSchema,
  llmPredictionStatsSchema,
  modelDescriptorSchema,
  modelSpecifierSchema,
  ProcessingUpdateSchema,
  serializedLMSExtendedErrorSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { createBaseModelBackendInterface } from "./baseModelBackendInterface";

export function createLlmBackendInterface() {
  return createBaseModelBackendInterface()
    .addChannelEndpoint("predict", {
      creationParameter: z.object({
        modelSpecifier: modelSpecifierSchema,
        history: chatHistoryDataSchema,
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
        history: chatHistoryDataSchema,
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
          input: chatMessageDataSchema,
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
        }),
        z.object({
          type: z.literal("abort"),
          taskId: z.string(),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("complete"),
          taskId: z.string(),
          processed: chatMessageDataSchema,
        }),
        z.object({
          type: z.literal("error"),
          taskId: z.string(),
          error: serializedLMSExtendedErrorSchema,
        }),
      ]),
    })
    .addChannelEndpoint("registerGenerator", {
      creationParameter: z.object({
        identifier: z.string(),
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("generate"),
          taskId: z.string(),
          input: chatMessageDataSchema,
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
        }),
        z.object({
          type: z.literal("abort"),
          taskId: z.string(),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("complete"),
          taskId: z.string(),
        }),
        z.object({
          type: z.literal("error"),
          taskId: z.string(),
          error: serializedLMSExtendedErrorSchema,
        }),
      ]),
    })
    .addRpcEndpoint("processingHandleUpdate", {
      parameter: z.object({
        /** Processing Context Identifier */
        pci: z.string(),
        token: z.string(),
        update: ProcessingUpdateSchema,
      }),
      returns: z.void(),
    })
    .addRpcEndpoint("processingGetHistory", {
      parameter: z.object({
        /** Processing Context Identifier */
        pci: z.string(),
        token: z.string(),
      }),
      returns: chatHistoryDataSchema,
    });
}

export type LLMPort = InferClientPort<typeof createLlmBackendInterface>;
export type LLMBackendInterface = ReturnType<typeof createLlmBackendInterface>;
