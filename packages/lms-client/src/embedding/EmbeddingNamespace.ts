import { type SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type EmbeddingPort } from "@lmstudio/lms-external-backend-interfaces";
import { embeddingLlamaLoadConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  embeddingLoadModelConfigSchema,
  type EmbeddingLoadModelConfig,
  type KVConfig,
  type ModelDescriptor,
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
      "llama.load.mainGpu": config.gpu?.mainGpu,
      "llama.load.splitStrategy": config.gpu?.splitStrategy,
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
    instanceReference: string,
    descriptor: ModelDescriptor,
    validator: Validator,
    logger: SimpleLogger,
  ): EmbeddingModel {
    return new EmbeddingModel(port, instanceReference, descriptor, validator, logger);
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
