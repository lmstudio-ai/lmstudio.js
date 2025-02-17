import { getCurrentStack, SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type EmbeddingPort } from "@lmstudio/lms-external-backend-interfaces";
import { type EmbeddingModelInstanceInfo, type ModelSpecifier } from "@lmstudio/lms-shared-types";
import { type SpecificModel } from "../modelShared/SpecificModel.js";
import { EmbeddingDynamicHandle } from "./EmbeddingDynamicHandle.js";

/**
 * Represents a specific loaded Embedding. Most Embedding related operations are inherited from
 * {@link EmbeddingDynamicHandle}.
 *
 * @public
 */
export class EmbeddingModel
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
    info: EmbeddingModelInstanceInfo,
    validator: Validator,
    logger: SimpleLogger = new SimpleLogger(`EmbeddingModel`),
  ) {
    const specifier: ModelSpecifier = {
      type: "instanceReference",
      instanceReference: info.instanceReference,
    };
    super(embeddingPort, specifier, validator, logger);
    this.identifier = info.identifier;
    this.path = info.path;
  }
  public async unload() {
    const stack = getCurrentStack(1);
    await this.port.callRpc("unloadModel", { identifier: this.identifier }, { stack });
  }
}
