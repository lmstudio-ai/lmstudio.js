import { type SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type EmbeddingPort } from "@lmstudio/lms-external-backend-interfaces";
import { embeddingLoadSchematics } from "@lmstudio/lms-kv-config";
import {
  embeddingLoadModelConfigSchema,
  type EmbeddingLoadModelConfig,
  type KVConfig,
  type ModelDescriptor,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { ModelNamespace } from "../modelShared/ModelNamespace";
import { EmbeddingDynamicHandle } from "./EmbeddingDynamicHandle";
import { EmbeddingSpecificModel } from "./EmbeddingSpecificModel";

/** @public */
export class EmbeddingNamespace extends ModelNamespace<
  EmbeddingPort,
  EmbeddingLoadModelConfig,
  EmbeddingDynamicHandle,
  EmbeddingSpecificModel
> {
  protected override readonly namespace = "embedding";
  protected override readonly defaultLoadConfig = {};
  protected override readonly loadModelConfigSchema = embeddingLoadModelConfigSchema;
  protected override loadConfigToKVConfig(config: EmbeddingLoadModelConfig): KVConfig {
    return embeddingLoadSchematics.buildPartialConfig({
      "llama.gpuOffload": config.gpuOffload,
      "contextLength": config.contextLength,
      "llama.ropeFrequencyBase": config.ropeFrequencyBase,
      "llama.ropeFrequencyScale": config.ropeFrequencyScale,
      "llama.keepModelInMemory": config.keepModelInMemory,
      "llama.tryMmap": config.tryMmap,
    });
  }
  protected override createDomainSpecificModel(
    port: EmbeddingPort,
    instanceReference: string,
    descriptor: ModelDescriptor,
    validator: Validator,
    logger: SimpleLogger,
  ): EmbeddingSpecificModel {
    return new EmbeddingSpecificModel(port, instanceReference, descriptor, validator, logger);
  }
  protected override createDomainDynamicHandle(
    port: EmbeddingPort,
    specifier: ModelSpecifier,
    validator: Validator,
    logger: SimpleLogger,
  ): EmbeddingDynamicHandle {
    return new EmbeddingDynamicHandle(port, specifier, validator, logger);
  }
}
