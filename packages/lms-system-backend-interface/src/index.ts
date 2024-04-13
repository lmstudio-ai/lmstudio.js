import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { downloadedModelSchema } from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createSystemBackendInterface() {
  return new BackendInterface()
    .addRpcEndpoint("echo", {
      parameter: z.string(),
      returns: z.string(),
    })
    .addRpcEndpoint("listDownloadedModels", {
      parameter: z.void(),
      returns: z.array(downloadedModelSchema),
    });
}

export type SystemPort = InferClientPort<typeof createSystemBackendInterface>;
export type SystemBackendInterface = ReturnType<typeof createSystemBackendInterface>;
