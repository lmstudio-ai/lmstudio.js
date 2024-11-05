import { filteredArray } from "@lmstudio/lms-common";
import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { downloadedModelSchema } from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createSystemBackendInterface() {
  return new BackendInterface()
    .addRpcEndpoint("listDownloadedModels", {
      parameter: z.void(),
      returns: filteredArray(downloadedModelSchema),
    })
    .addChannelEndpoint("alive", {
      creationParameter: z.void(),
      toServerPacket: z.void(),
      toClientPacket: z.void(),
    });
}

export type SystemPort = InferClientPort<typeof createSystemBackendInterface>;
export type SystemBackendInterface = ReturnType<typeof createSystemBackendInterface>;
