import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  kvConfigSchema,
  kvConfigStackSchema,
  modelDescriptorSchema,
  modelSpecifierSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";

/**
 * Create a base model backend interface that are used by all domain-specific model backend
 * interfaces.
 */
export function createBaseModelBackendInterface() {
  return new BackendInterface()
    .addChannelEndpoint("loadModel", {
      creationParameter: z.object({
        path: z.string(),
        identifier: z.string().optional(),
        loadConfigStack: kvConfigStackSchema,
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("resolved"),
          fullPath: z.string(),
          ambiguous: z.array(z.string()).optional(),
        }),
        z.object({
          type: z.literal("progress"),
          progress: z.number(),
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
    .addRpcEndpoint("listLoaded", {
      parameter: z.undefined(),
      returns: z.array(modelDescriptorSchema),
    })
    .addRpcEndpoint("getModelInfo", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
        throwIfNotFound: z.boolean(),
      }),
      returns: z
        .object({
          instanceReference: z.string(),
          descriptor: modelDescriptorSchema,
        })
        .optional(),
    })
    .addRpcEndpoint("getLoadConfig", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
      }),
      returns: kvConfigSchema,
    })
    .addChannelEndpoint("getOrLoad", {
      creationParameter: z.object({
        identifier: z.string(),
        loadConfigStack: kvConfigStackSchema,
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("alreadyLoaded"),
          identifier: z.string(),
          fullPath: z.string(),
          instanceReference: z.string(),
        }),
        z.object({
          type: z.literal("startLoading"),
          identifier: z.string(),
          fullPath: z.string(),
        }),
        z.object({
          type: z.literal("loadProgress"),
          progress: z.number(),
        }),
        z.object({
          type: z.literal("loadSuccess"),
          identifier: z.string(),
          instanceReference: z.string(),
          fullPath: z.string(),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("cancel"),
        }),
      ]),
    });
}

export type BaseModelPort = InferClientPort<typeof createBaseModelBackendInterface>;
export type BaseModelBackendInterface = ReturnType<typeof createBaseModelBackendInterface>;
