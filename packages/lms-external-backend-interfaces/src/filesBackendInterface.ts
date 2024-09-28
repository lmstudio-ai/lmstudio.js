import { BackendInterface } from "@lmstudio/lms-communication";
import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { z } from "zod";

export function createFilesBackendInterface() {
  return new BackendInterface().addRpcEndpoint("getLocalFileAbsolutePath", {
    parameter: z.object({
      fileName: z.string(),
    }),
    returns: z.object({
      path: z.string(),
    }),
  });
}

export type FilesPort = InferClientPort<typeof createFilesBackendInterface>;
export type FilesBackendInterface = ReturnType<typeof createFilesBackendInterface>;
