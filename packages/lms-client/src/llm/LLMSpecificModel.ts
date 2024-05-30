import { SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-llm-backend-interface";
import { type LLMDescriptor, type ModelSpecifier } from "@lmstudio/lms-shared-types";
import { LLMDynamicHandle } from "./LLMDynamicHandle";

/**
 * Represents a specific loaded model. Most LLM related operations are inherited from
 * {@link LLMDynamicHandle}.
 *
 * @public
 */
export class LLMSpecificModel extends LLMDynamicHandle {
  public readonly identifier: string;
  public readonly path: string;
  /** @internal */
  public constructor(
    llmPort: LLMPort,
    instanceReference: string,
    descriptor: LLMDescriptor,
    validator: Validator,
    logger: SimpleLogger = new SimpleLogger(`LLMSpecificModel`),
  ) {
    const specifier: ModelSpecifier = {
      type: "instanceReference",
      instanceReference,
    };
    super(llmPort, specifier, validator, logger);
    this.identifier = descriptor.identifier;
    this.path = descriptor.path;
  }
}
