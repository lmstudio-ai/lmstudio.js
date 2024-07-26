import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  kvConfigSchema,
  kvConfigStackSchema,
  llmApplyPromptTemplateOptsSchema,
  llmContextSchema,
  llmDescriptorSchema,
  llmPredictionStatsSchema,
  modelSpecifierSchema,
  processorInputContextSchema,
  processorInputMessageSchema,
  promptPreprocessorUpdateSchema,
  serializedLMSExtendedErrorSchema,
} from "@lmstudio/lms-shared-types";
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
        loadConfigStack: kvConfigStackSchema,
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
          identifier: z.string(),
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
        modelSpecifier: modelSpecifierSchema,
        context: llmContextSchema,
        predictionConfigStack: kvConfigStackSchema,
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
          modelInfo: llmDescriptorSchema,
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
    .addRpcEndpoint("listLoaded", {
      parameter: z.undefined(),
      returns: z.array(llmDescriptorSchema),
    })
    .addRpcEndpoint("getModelInfo", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
        throwIfNotFound: z.boolean(),
      }),
      returns: z
        .object({
          instanceReference: z.string(),
          descriptor: llmDescriptorSchema,
        })
        .optional(),
    })
    .addRpcEndpoint("getLoadConfig", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
      }),
      returns: kvConfigSchema,
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
