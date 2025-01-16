import { type SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import { llmLlamaMoeLoadConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  llmLoadModelConfigSchema,
  type KVConfig,
  type LLMLoadModelConfig,
  type ModelDescriptor,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { cacheQuantizationTypeToCheckbox } from "../cacheQuantizationTypeToCheckbox.js";
import { ModelNamespace } from "../modelShared/ModelNamespace.js";
import { numberToCheckboxNumeric } from "../numberToCheckboxNumeric.js";
import { LLMDynamicHandle } from "./LLMDynamicHandle.js";
import { LLMSpecificModel } from "./LLMSpecificModel.js";

/** @public */
export class LLMNamespace extends ModelNamespace<
  /** @internal */
  LLMPort,
  LLMLoadModelConfig,
  LLMDynamicHandle,
  LLMSpecificModel
> {
  /** @internal */
  protected override readonly namespace = "llm";
  /** @internal */
  protected override readonly defaultLoadConfig = {};
  /** @internal */
  protected override readonly loadModelConfigSchema = llmLoadModelConfigSchema;
  /** @internal */
  protected override loadConfigToKVConfig(config: LLMLoadModelConfig): KVConfig {
    return llmLlamaMoeLoadConfigSchematics.buildPartialConfig({
      "contextLength": config.contextLength,
      "llama.evalBatchSize": config.evalBatchSize,
      "llama.acceleration.offloadRatio": config.gpuOffload?.ratio,
      "llama.load.mainGpu": config.gpuOffload?.mainGpu,
      "llama.load.tensorSplit": config.gpuOffload?.tensorSplit,
      "llama.load.splitStrategy": config.gpuOffload?.splitStrategy,
      "llama.flashAttention": config.flashAttention,
      "llama.ropeFrequencyBase": numberToCheckboxNumeric(config.ropeFrequencyBase, 0, 0),
      "llama.ropeFrequencyScale": numberToCheckboxNumeric(config.ropeFrequencyScale, 0, 0),
      "llama.keepModelInMemory": config.keepModelInMemory,
      "seed": numberToCheckboxNumeric(config.seed, -1, 0),
      "llama.useFp16ForKVCache": config.useFp16ForKVCache,
      "llama.tryMmap": config.tryMmap,
      "numExperts": config.numExperts,
      "llama.kCacheQuantizationType": cacheQuantizationTypeToCheckbox({
        value: config.llamaKCacheQuantizationType,
        falseDefault: "f16",
      }),
      "llama.vCacheQuantizationType": cacheQuantizationTypeToCheckbox({
        value: config.llamaVCacheQuantizationType,
        falseDefault: "f16",
      }),
    });
  }
  /** @internal */
  protected override createDomainSpecificModel(
    port: LLMPort,
    instanceReference: string,
    descriptor: ModelDescriptor,
    validator: Validator,
    logger: SimpleLogger,
  ): LLMSpecificModel {
    return new LLMSpecificModel(port, instanceReference, descriptor, validator, logger);
  }
  /** @internal */
  protected override createDomainDynamicHandle(
    port: LLMPort,
    specifier: ModelSpecifier,
    validator: Validator,
    logger: SimpleLogger,
  ): LLMDynamicHandle {
    return new LLMDynamicHandle(port, specifier, validator, logger);
  }
}
