import { type BaseModelPort } from "@lmstudio/lms-external-backend-interfaces";
import { type ModelInfoBase, type ModelInstanceInfoBase } from "@lmstudio/lms-shared-types";
import { type DynamicHandle } from "./DynamicHandle.js";

/**
 * @public
 */
export interface SpecificModel<
  /** @internal */
  TClientPort extends BaseModelPort<ModelInstanceInfoBase, ModelInfoBase>,
> extends DynamicHandle<
    // prettier-ignore
    /** @internal */ TClientPort,
    ModelInstanceInfoBase
  > {
  readonly identifier: string;
  readonly path: string;
  unload(): Promise<void>;
}
