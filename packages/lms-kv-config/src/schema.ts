/**
 * This file is divided into 4 sections:
 *
 * 1. globalConfigSchematics: The pool for all config keys and their types
 * 2. Functionality scope definitions: i.e. what config keys are available in what functionality
 *    scope. An example functionality scope is llmPrediction.
 * 3. Functionality scope mapper functions: Lookup functions for getting a functionality scope, for
 *    example, given a ModelCompatibilityType, get the associated functionality scope for predicting
 *    with it.
 * 4. Utility types that can be used to work with types of schema.
 */

import {
  type InferConfigSchemaKeys,
  type InferConfigSchemaMap,
  type InferValueTypeKeys,
  type InferValueTypeMap,
  KVConfigSchematicsBuilder,
} from "./KVConfig";
import { kvValueTypesLibrary } from "./valueTypes";

// ---------------------------
//  1. globalConfigSchematics
// ---------------------------

export const globalConfigSchematics = new KVConfigSchematicsBuilder(kvValueTypesLibrary)
  .scope("llm.prediction", builder =>
    builder
      .field("temperature", "numeric", { min: 0, max: 1, step: 0.01, shortHand: "temp" }, 0.8)
      .field("contextOverflowPolicy", "contextOverflowPolicy", undefined, "stopAtLimit")
      .field(
        "maxPredictedTokens",
        "checkboxNumeric",
        { disabledValue: -1, min: 1, step: 1, int: true },
        -1,
      )
      .field("stopStrings", "stringArray", {}, [])
      .field("structured", "llamaStructuredOutput", undefined, {
        type: "none",
      })
      .scope("llama", builder =>
        builder
          .field("topKSampling", "numeric", { min: -1, max: 500, step: 1, int: true }, 40)
          .field(
            "repeatPenalty",
            "checkboxNumeric",
            { disabledValue: 1, min: -1, max: 50, step: 0.1 },
            1.1,
          )
          .field(
            "minPSampling",
            "checkboxNumeric",
            { disabledValue: 0, min: 0, max: 1, step: 0.01 },
            0.05,
          )
          .field(
            "topPSampling",
            "checkboxNumeric",
            { disabledValue: 1, min: 0, max: 1, step: 0.01 },
            0.95,
          )
          .field("cpuThreads", "numeric", { min: 1, int: true }, 4),
      ),
  )
  .scope("llm.load", builder =>
    builder
      .field("contextLength", "numeric", { min: 1, int: true }, 2048) // asd
      .scope("llama", builder =>
        builder
          .field("evalBatchSize", "numeric", { min: 1, int: true }, 512)
          .field("gpuOffload", "llamaGpuOffload", undefined, {
            ratio: "auto",
            mainGpu: 0,
            tensorSplit: [0],
          })
          .field("flashAttention", "boolean", undefined, false)
          .field("ropeFrequencyBase", "numeric", {}, 0)
          .field("ropeFrequencyScale", "numeric", {}, 0)
          .field("keepModelInMemory", "boolean", undefined, true)
          .field("seed", "numeric", { int: true }, 0) // asd
          .field("useFp16ForKVCache", "boolean", undefined, true)
          .field("tryMmap", "boolean", undefined, true)
          .field("numExperts", "numeric", { min: 0, int: true }, 0),
      ),
  )
  .build();

// ------------------------------------
//  2. Functionality scope definitions
// ------------------------------------

export const llmLlamaPredictionConfigSchematics = globalConfigSchematics
  .scoped("llm.prediction")
  .sliced(
    "llama.*",
    "temperature",
    "contextOverflowPolicy",
    "maxPredictedTokens",
    "stopStrings",
    "structured",
  );

export const llmLlamaLoadConfigSchematics = globalConfigSchematics
  .scoped("llm.load")
  .sliced("llama.*", "contextLength");

export const emptyConfigSchematics = new KVConfigSchematicsBuilder(kvValueTypesLibrary).build();

// -----------------------------------------
//  3. Functionality scope mapper functions
// -----------------------------------------

export function getLLMPredictionConfigSchematics(modelCompatibilityType: string) {
  switch (modelCompatibilityType) {
    case "gguf":
      return llmLlamaPredictionConfigSchematics;
    default:
      throw new Error(`Unknown model compatibility type: ${modelCompatibilityType}`);
  }
}
export type LLMPredictionConfigSchematics = ReturnType<typeof getLLMPredictionConfigSchematics>;

export function getLLMLoadConfigSchematics(modelCompatibilityType: string) {
  switch (modelCompatibilityType) {
    case "gguf":
      return llmLlamaLoadConfigSchematics;
    default:
      throw new Error(`Unknown model compatibility type: ${modelCompatibilityType}`);
  }
}
export type LLMLoadConfigSchematics = ReturnType<typeof getLLMLoadConfigSchematics>;

// ------------------
//  4. Utility types
// ------------------

export type GlobalKVValueTypeMap = InferValueTypeMap<typeof kvValueTypesLibrary>;
/**
 * All the value type keys
 */
export type GlobalKVValueTypeKeys = InferValueTypeKeys<typeof kvValueTypesLibrary>;
/**
 * Given a value type key, look up the typescript type of the value
 */
export type GlobalKVValueTypeValueTypeForKey<TKey extends GlobalKVValueTypeKeys> =
  GlobalKVValueTypeMap[TKey]["value"];
/**
 * Given a value type key, look up the typescript type of the param
 */
export type GlobalKVValueTypeParamTypeForKey<TKey extends GlobalKVValueTypeKeys> =
  GlobalKVValueTypeMap[TKey]["param"];

export type GlobalConfigSchemaMap = InferConfigSchemaMap<typeof globalConfigSchematics>;
/**
 * All the config keys
 */
export type GlobalConfigSchemaKeys = InferConfigSchemaKeys<typeof globalConfigSchematics>;
/**
 * Given a config key, look up the typescript type of the value
 */
export type GlobalConfigSchemaTypeForKey<TKey extends GlobalConfigSchemaKeys> =
  GlobalConfigSchemaMap[TKey]["type"];
/**
 * Given a config key, look up the value type key
 */
export type GlobalConfigSchemaValueTypeKeyForKey<TKey extends GlobalConfigSchemaKeys> =
  GlobalConfigSchemaMap[TKey]["valueTypeKey"];
