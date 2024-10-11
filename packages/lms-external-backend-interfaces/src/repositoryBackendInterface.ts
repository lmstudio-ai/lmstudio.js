import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import {
  modelSearchOptsSchema,
  modelSearchResultDownloadOptionDataSchema,
  modelSearchResultEntryDataSchema,
  modelSearchResultIdentifierSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createRepositoryBackendInterface() {
  return new BackendInterface()
    .addRpcEndpoint("searchModels", {
      parameter: z.object({
        opts: modelSearchOptsSchema,
      }),
      returns: z.object({
        results: z.array(modelSearchResultEntryDataSchema),
      }),
    })
    .addRpcEndpoint("getModelDownloadOptions", {
      parameter: z.object({
        modelSearchResultIdentifier: modelSearchResultIdentifierSchema,
      }),
      returns: z.object({
        results: z.array(modelSearchResultDownloadOptionDataSchema),
      }),
    })
    .addChannelEndpoint("downloadModel", {
      creationParameter: z.object({
        downloadIdentifier: z.string(),
      }),
      toClientPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("downloadProgress"),
          downloadedBytes: z.number(),
          totalBytes: z.number(),
        }),
        z.object({
          type: z.literal("startFinalizing"),
        }),
      ]),
      toServerPacket: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("cancel"),
        }),
      ]),
    });
}

export type RepositoryPort = InferClientPort<typeof createRepositoryBackendInterface>;
export type RepositoryBackendInterface = ReturnType<typeof createRepositoryBackendInterface>;
