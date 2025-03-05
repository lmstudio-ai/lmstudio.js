import { type SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type EmbeddingPort } from "@lmstudio/lms-external-backend-interfaces";
import { embeddingLlamaLoadConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  convertGPUSettingToGPUSplitConfig,
  embeddingLoadModelConfigSchema,
  type EmbeddingLoadModelConfig,
  type EmbeddingModelInfo,
  type EmbeddingModelInstanceInfo,
  type KVConfig,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { ModelNamespace } from "../modelShared/ModelNamespace.js";
import { numberToCheckboxNumeric } from "../numberToCheckboxNumeric.js";
import { EmbeddingDynamicHandle } from "./EmbeddingDynamicHandle.js";
import { EmbeddingModel } from "./EmbeddingModel.js";

/** @public */
export class EmbeddingNamespace extends ModelNamespace<
  /** @internal */
  EmbeddingPort,
  EmbeddingLoadModelConfig,
  EmbeddingModelInstanceInfo,
  EmbeddingModelInfo,
  EmbeddingDynamicHandle,
  EmbeddingModel
> {
  /** @internal */
  protected override readonly namespace = "embedding";
  /** @internal */
  protected override readonly defaultLoadConfig = {};
  /** @internal */
  protected override readonly loadModelConfigSchema = embeddingLoadModelConfigSchema;
  /** @internal */
  protected override loadConfigToKVConfig(config: EmbeddingLoadModelConfig): KVConfig {
    return embeddingLlamaLoadConfigSchematics.buildPartialConfig({
      "llama.acceleration.offloadRatio": config.gpu?.ratio,
      "load.gpuSplitConfig": convertGPUSettingToGPUSplitConfig(config.gpu),
      "contextLength": config.contextLength,
      "llama.ropeFrequencyBase": numberToCheckboxNumeric(config.ropeFrequencyBase, 0, 0),
      "llama.ropeFrequencyScale": numberToCheckboxNumeric(config.ropeFrequencyScale, 0, 0),
      "llama.keepModelInMemory": config.keepModelInMemory,
      "llama.tryMmap": config.tryMmap,
    });
  }
  /** @internal */
  protected override createDomainSpecificModel(
    port: EmbeddingPort,
    info: EmbeddingModelInstanceInfo,
    validator: Validator,
    logger: SimpleLogger,
  ): EmbeddingModel {
    return new EmbeddingModel(port, info, validator, logger);
  }
  /** @internal */
  protected override createDomainDynamicHandle(
    port: EmbeddingPort,
    specifier: ModelSpecifier,
    validator: Validator,
    logger: SimpleLogger,
  ): EmbeddingDynamicHandle {
    return new EmbeddingDynamicHandle(port, specifier, validator, logger);
  }
}
