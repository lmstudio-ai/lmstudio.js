import { getCurrentStack, SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import { type ModelDescriptor, type ModelSpecifier } from "@lmstudio/lms-shared-types";
import { type SpecificModel } from "../modelShared/SpecificModel.js";
import { LLMDynamicHandle } from "./LLMDynamicHandle.js";

/**
 * Represents a specific loaded LLM. Most LLM related operations are inherited from
 * {@link LLMDynamicHandle}.
 *
 * @public
 */
export class LLM
  extends LLMDynamicHandle
  implements
    SpecificModel<// prettier-ignore
    /** @internal */ LLMPort>
{
  public readonly identifier: string;
  public readonly path: string;
  /** @internal */
  public constructor(
    llmPort: LLMPort,
    instanceReference: string,
    descriptor: ModelDescriptor,
    validator: Validator,
    logger: SimpleLogger = new SimpleLogger(`LLM`),
  ) {
    const specifier: ModelSpecifier = {
      type: "instanceReference",
      instanceReference,
    };
    super(llmPort, specifier, validator, logger);
    this.identifier = descriptor.identifier;
    this.path = descriptor.path;
  }
  public async unload() {
    const stack = getCurrentStack(1);
    await this.port.callRpc("unloadModel", { identifier: this.identifier }, { stack });
  }
}
