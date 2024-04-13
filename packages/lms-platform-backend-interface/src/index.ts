import { BackendInterface } from "@lmstudio/lms-communication";
import { z } from "zod";

export function createPlatformBackendInterface() {
  return new BackendInterface().addRpcEndpoint("echo", {
    parameter: z.string(),
    returns: z.string(),
  });
}
