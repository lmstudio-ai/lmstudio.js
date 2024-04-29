import { SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-llm-backend-interface";
import { type LLMDescriptor, type LLMModelSpecifier } from "@lmstudio/lms-shared-types";
import { LLMDynamicHandle } from "./LLMDynamicHandle";

/**
 * Represents a specific loaded model. Most LLM related operations are inherited from
 * {@link LLMDynamicHandle}.
 */
export class LLMSpecificModel extends LLMDynamicHandle {
  public readonly identifier: string;
  public readonly path: string;
  public constructor(
    llmPort: LLMPort,
    sessionIdentifier: string,
    descriptor: LLMDescriptor,
    validator: Validator,
    logger: SimpleLogger = new SimpleLogger(`LLMSpecificModel`),
  ) {
    const specifier: LLMModelSpecifier = {
      type: "sessionIdentifier",
      sessionIdentifier,
    };
    super(llmPort, specifier, validator, logger);
    this.identifier = descriptor.identifier;
    this.path = descriptor.path;
  }
}
