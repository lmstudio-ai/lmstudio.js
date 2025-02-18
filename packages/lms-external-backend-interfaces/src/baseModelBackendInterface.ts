import { type DeepReplaceType2 } from "@lmstudio/lms-common";
import { BackendInterface } from "@lmstudio/lms-communication";
import { type ClientPort } from "@lmstudio/lms-communication-client";
import {
  kvConfigSchema,
  kvConfigStackSchema,
  type ModelInfoBase,
  type ModelInstanceInfoBase,
  modelSpecifierSchema,
} from "@lmstudio/lms-shared-types";
import { z, type ZodSchema } from "zod";

/**
 * Create a base model backend interface that are used by all domain-specific model backend
 * interfaces.
 */
export function createBaseModelBackendInterface<
  TModelInstanceInfo extends ModelInstanceInfoBase,
  TModelInfoSchema extends ModelInfoBase,
>(
  modelInstanceInfoSchema: ZodSchema<TModelInstanceInfo>,
  modelInfoSchema: ZodSchema<TModelInfoSchema>,
) {
  return new BackendInterface()
    .addChannelEndpoint("loadModel", {
      creationParameter: z.object({
        modelKey: z.string(),
        identifier: z.string().optional(),
        /**
         * If provided, when the model is not used for this amount of time, it will be unloaded.
         */
        ttlMs: z.number().int().min(1).optional(),
        loadConfigStack: kvConfigStackSchema,
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("resolved"),
          info: modelInfoSchema,
          ambiguous: z.array(z.string()).optional(),
        }),
        z.object({
          type: z.literal("progress"),
          progress: z.number(),
        }),
        z.object({
          type: z.literal("success"),
          info: modelInstanceInfoSchema,
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
      returns: z.array(modelInstanceInfoSchema),
    })
    .addRpcEndpoint("getModelInfo", {
      parameter: z.object({
        specifier: modelSpecifierSchema,
        throwIfNotFound: z.boolean(),
      }),
      returns: modelInstanceInfoSchema.optional(),
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
        /**
         * If provided and a new instance is loaded as a result of this call, it will be unloaded
         * after idling for this amount of time.
         */
        loadTtlMs: z.number().int().min(1).optional(),
        loadConfigStack: kvConfigStackSchema,
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("alreadyLoaded"),
          info: modelInstanceInfoSchema,
        }),
        z.object({
          type: z.literal("startLoading"),
          identifier: z.string(),
          info: modelInfoSchema,
        }),
        z.object({
          type: z.literal("loadProgress"),
          progress: z.number(),
        }),
        z.object({
          type: z.literal("loadSuccess"),
          info: modelInstanceInfoSchema,
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("cancel"),
        }),
      ]),
    });
}

export type BaseModelPort<
  TModelInstanceInfo extends ModelInstanceInfoBase,
  TModelInfo extends ModelInfoBase,
> = typeof createBaseModelBackendInterface extends (
  ...args: any[]
) => BackendInterface<
  infer _RContext,
  infer RRpcEndpoints,
  infer RChannelEndpoints,
  infer RSignalEndpoints,
  infer RWritableSignalEndpoints
>
  ? ClientPort<
      DeepReplaceType2<
        RRpcEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >,
      DeepReplaceType2<
        RChannelEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >,
      DeepReplaceType2<
        RSignalEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >,
      DeepReplaceType2<
        RWritableSignalEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >
    >
  : never;
export type BaseModelBackendInterface<
  TModelInstanceInfo extends ModelInstanceInfoBase,
  TModelInfo extends ModelInfoBase,
> = typeof createBaseModelBackendInterface extends (
  ...args: any[]
) => BackendInterface<
  infer RContext,
  infer RRpcEndpoints,
  infer RChannelEndpoints,
  infer RSignalEndpoints,
  infer RWritableSignalEndpoints
>
  ? BackendInterface<
      RContext,
      DeepReplaceType2<
        RRpcEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >,
      DeepReplaceType2<
        RChannelEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >,
      DeepReplaceType2<
        RSignalEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >,
      DeepReplaceType2<
        RWritableSignalEndpoints,
        ModelInstanceInfoBase,
        TModelInstanceInfo,
        ModelInfoBase,
        TModelInfo
      >
    >
  : never;
