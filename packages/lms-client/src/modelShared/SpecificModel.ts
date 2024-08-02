import { type InferClientPort } from "@lmstudio/lms-communication-client";
import { type createBaseModelBackendInterface } from "@lmstudio/lms-external-backend-interfaces";
import { type DynamicHandle } from "./DynamicHandle";

export interface SpecificModel<
  TClientPort extends InferClientPort<typeof createBaseModelBackendInterface>,
> extends DynamicHandle<TClientPort> {
  readonly identifier: string;
  readonly path: string;
}
