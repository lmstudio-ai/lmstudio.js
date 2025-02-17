import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { backendNotificationSchema, modelInfoSchema } from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createSystemBackendInterface() {
  return (
    new BackendInterface()
      .addRpcEndpoint("listDownloadedModels", {
        parameter: z.void(),
        returns: z.array(modelInfoSchema),
      })
      .addChannelEndpoint("alive", {
        creationParameter: z.void(),
        toServerPacket: z.void(),
        toClientPacket: z.void(),
      })
      .addRpcEndpoint("notify", {
        parameter: backendNotificationSchema,
        returns: z.void(),
      })
      /**
       * Get the LM Studio version
       */
      .addRpcEndpoint("version", {
        parameter: z.void(),
        returns: z.object({
          /**
           * `major.minor.patch`
           */
          version: z.string(),
          /**
           * LM Studio build number
           */
          build: z.number(),
        }),
      })
  );
}

export type SystemPort = InferClientPort<typeof createSystemBackendInterface>;
export type SystemBackendInterface = ReturnType<typeof createSystemBackendInterface>;
