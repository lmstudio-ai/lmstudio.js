import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { fileTypeSchema } from "@lmstudio/lms-shared-types";
import { z } from "zod";

export function createFilesBackendInterface() {
  return new BackendInterface()
    .addRpcEndpoint("getLocalFileAbsolutePath", {
      parameter: z.object({
        fileName: z.string(),
      }),
      returns: z.object({
        path: z.string(),
      }),
    })
    .addRpcEndpoint("uploadFileBase64", {
      parameter: z.object({
        name: z.string(),
        contentBase64: z.string(),
      }),
      returns: z.object({
        identifier: z.string(),
        fileType: fileTypeSchema,
        sizeBytes: z.number().int(),
      }),
    });
}

export type FilesPort = InferClientPort<typeof createFilesBackendInterface>;
export type FilesBackendInterface = ReturnType<typeof createFilesBackendInterface>;
