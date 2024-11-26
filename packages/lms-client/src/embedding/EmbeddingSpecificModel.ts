import { SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type EmbeddingPort } from "@lmstudio/lms-external-backend-interfaces";
import { type ModelDescriptor, type ModelSpecifier } from "@lmstudio/lms-shared-types";
import { type SpecificModel } from "../modelShared/SpecificModel.js";
import { EmbeddingDynamicHandle } from "./EmbeddingDynamicHandle.js";

/**
 * Represents a specific loaded Embedding. Most Embedding related operations are inherited from
 * {@link EmbeddingDynamicHandle}.
 *
 * @public
 */
export class EmbeddingSpecificModel
  extends EmbeddingDynamicHandle
  implements
    SpecificModel<// prettier-ignore
    /** @internal */ EmbeddingPort>
{
  public readonly identifier: string;
  public readonly path: string;
  /** @internal */
  public constructor(
    embeddingPort: EmbeddingPort,
    instanceReference: string,
    descriptor: ModelDescriptor,
    validator: Validator,
    logger: SimpleLogger = new SimpleLogger(`EmbeddingSpecificModel`),
  ) {
    const specifier: ModelSpecifier = {
      type: "instanceReference",
      instanceReference,
    };
    super(embeddingPort, specifier, validator, logger);
    this.identifier = descriptor.identifier;
    this.path = descriptor.path;
  }
}
