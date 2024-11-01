import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  chatHistoryDataSchema,
  chatMessageDataSchema,
  kvConfigSchema,
  processingUpdateSchema,
  serializedKVConfigSchematicsSchema,
  serializedLMSExtendedErrorSchema,
} from "@lmstudio/lms-shared-types";
import { pluginManifestSchema } from "@lmstudio/lms-shared-types/dist/PluginManifest";
import { z } from "zod";

export function createPluginsBackendInterface() {
  return (
    new BackendInterface()
      /**
       * The following method is called by the controlling client. (e.g. lms-cli)
       */
      .addChannelEndpoint("registerDevelopmentPlugin", {
        creationParameter: z.object({
          manifest: pluginManifestSchema,
        }),
        toClientPacket: z.discriminatedUnion("type", [
          z.object({
            type: z.literal("ready"),
            clientIdentifier: z.string(),
            clientPasskey: z.string(),
          }),
        ]),
        toServerPacket: z.discriminatedUnion("type", [
          z.object({
            type: z.literal("end"),
          }),
        ]),
      })

      /**
       * The following method is called by the plugin client. (plugin:*)
       */
      .addChannelEndpoint("setPreprocessor", {
        creationParameter: z.void(),
        toClientPacket: z.discriminatedUnion("type", [
          z.object({
            type: z.literal("preprocess"),
            taskId: z.string(),
            input: chatMessageDataSchema,
            config: kvConfigSchema,
            pluginConfig: kvConfigSchema,
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
            type: z.literal("aborted"),
            taskId: z.string(),
          }),
          z.object({
            type: z.literal("error"),
            taskId: z.string(),
            error: serializedLMSExtendedErrorSchema,
          }),
        ]),
      })
      .addChannelEndpoint("setGenerator", {
        creationParameter: z.void(),
        toClientPacket: z.discriminatedUnion("type", [
          z.object({
            type: z.literal("generate"),
            taskId: z.string(),
            config: kvConfigSchema,
            pluginConfig: kvConfigSchema,
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
            type: z.literal("aborted"),
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
          update: processingUpdateSchema,
        }),
        returns: z.void(),
      })
      .addRpcEndpoint("processingGetHistory", {
        parameter: z.object({
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
          includeCurrent: z.boolean(),
        }),
        returns: chatHistoryDataSchema,
      })
      .addRpcEndpoint("temp_processingGetCurrentlySelectedLLMIdentifier", {
        parameter: z.object({
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
        }),
        returns: z.object({
          identifier: z.string(),
        }),
      })
      .addRpcEndpoint("processingHasStatus", {
        parameter: z.object({
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
        }),
        returns: z.boolean(),
      })
      .addRpcEndpoint("processingNeedsNaming", {
        parameter: z.object({
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
        }),
        returns: z.boolean(),
      })
      .addRpcEndpoint("processingSuggestName", {
        parameter: z.object({
          /** Processing Context Identifier */
          pci: z.string(),
          token: z.string(),
          name: z.string(),
        }),
        returns: z.void(),
      })
      .addRpcEndpoint("setConfigSchematics", {
        parameter: z.object({
          schematics: serializedKVConfigSchematicsSchema,
        }),
        returns: z.void(),
      })
      .addRpcEndpoint("pluginInitCompleted", {
        parameter: z.void(),
        returns: z.void(),
      })
  );
}

export type PluginsPort = InferClientPort<typeof createPluginsBackendInterface>;
export type PluginsBackendInterface = ReturnType<typeof createPluginsBackendInterface>;
