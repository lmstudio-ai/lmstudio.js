/**
 * This file is divided into 4 sections:
 *
 * 1. globalConfigSchematics: The pool for all config keys and their types
 * 2. Functionality scope definitions: i.e. what config keys are available in what functionality
 *    scope. An example functionality scope is llmPrediction.
 * 3. Utility types that can be used to work with types of schema.
 */

import {
  KVConfigSchematicsBuilder,
  type InferConfigSchemaKeys,
  type InferConfigSchemaMap,
  type InferValueTypeKeys,
  type InferValueTypeMap,
  type KVConfigSchematics,
  type KVFieldValueTypeLibrary,
} from "./KVConfig";
import { kvValueTypesLibrary } from "./valueTypes";

// ---------------------------
//  1. globalConfigSchematics
// ---------------------------

export const globalConfigSchematics = new KVConfigSchematicsBuilder(kvValueTypesLibrary)
  .scope("llm.prediction", builder =>
    builder
      .field(
        "temperature",
        "numeric",
        {
          min: 0,
          step: 0.01,
          slider: { min: 0, max: 1, step: 0.01 },
          precision: 2,
          shortHand: "temp",
        },
        0.8,
      )
      .field("contextOverflowPolicy", "contextOverflowPolicy", {}, "truncateMiddle")
      .field(
        "maxPredictedTokens",
        "checkboxNumeric",
        { min: 1, int: true },
        { checked: false, value: 1000 },
      )
      .field("stopStrings", "stringArray", {}, [])
      .field("structured", "llamaStructuredOutput", {}, { type: "none" })
      .field(
        "promptTemplate",
        "llmPromptTemplate",
        { modelCentric: true },
        {
          type: "manual",
          manualPromptTemplate: {
            beforeSystem: "Instruct: ",
            afterSystem: "\n",
            beforeAssistant: "AI: ",
            afterAssistant: "\n",
            beforeUser: "Human: ",
            afterUser: "\n",
          },
          stopStrings: [],
        },
      )
      .field("systemPrompt", "string", { isParagraph: true }, "")
      .field("seed", "numeric", { int: true }, -1)
      .field("contextPrefill", "context", {}, [])
      .field("topKSampling", "numeric", { min: -1, max: 500, int: true }, 40)
      .field(
        "repeatPenalty",
        "checkboxNumeric",
        { min: -1, step: 0.01 },
        { checked: true, value: 1.1 },
      )
      .field(
        "minPSampling",
        "checkboxNumeric",
        { min: 0, max: 1, step: 0.01, precision: 2, slider: { min: 0, max: 1, step: 0.01 } },
        { checked: true, value: 0.05 },
      )
      .field(
        "topPSampling",
        "checkboxNumeric",
        { min: 0, max: 1, step: 0.01, precision: 2, slider: { min: 0, max: 1, step: 0.01 } },
        { checked: true, value: 0.95 },
      )
      .scope("llama", builder =>
        builder
          .field("cpuThreads", "numeric", { min: 1, int: true }, 4)
          .field(
            "frequencyPenalty",
            "checkboxNumeric",
            { precision: 2 },
            { checked: false, value: 0.0 },
          )
          .field(
            "presencePenalty",
            "checkboxNumeric",
            { precision: 2 },
            { checked: false, value: 0.0 },
          )
          .field(
            "mirostatSampling",
            "llamaMirostatSampling",
            {},
            {
              // Disabled by default
              version: 0,
              learningRate: 0.1,
              targetEntropy: 5,
            },
          )
          .field(
            "tailFreeSampling",
            "checkboxNumeric",
            { min: 0, max: 1, step: 0.01, precision: 2, slider: { min: 0, max: 1, step: 0.01 } },
            { checked: false, value: 0.95 },
          )
          .field(
            "locallyTypicalSampling",
            "checkboxNumeric",
            { min: 0, max: 1, step: 0.01, precision: 2, slider: { min: 0, max: 1, step: 0.01 } },
            { checked: false, value: 0.9 },
          )
          .field("logitBias", "llamaLogitBias", {}, []),
      )
      .scope("onnx", builder =>
        builder
          .field(
            "topKSampling",
            "checkboxNumeric",
            { min: 0, max: 5000, slider: { min: 1, max: 5000, step: 1 } },
            { checked: false, value: 40 },
          )
          .field(
            "repeatPenalty",
            "checkboxNumeric",
            { min: -1, step: 0.01 },
            { checked: true, value: 1.1 },
          )
          .field(
            "topPSampling",
            "checkboxNumeric",
            { min: 0, max: 1, step: 0.01, slider: { min: 0.01, max: 1, step: 0.01 } },
            { checked: false, value: 0.95 },
          ),
      ),
  )
  .scope("llm.load", builder =>
    builder
      .field(
        "contextLength",
        "contextLength",
        {
          machineDependent: true,
        },
        2048,
      )
      .field("numExperts", "numeric", { min: 0, int: true }, 0)
      .field("seed", "numeric", { int: true }, -1)
      .scope("llama", builder =>
        builder
          .scope("acceleration", builder =>
            builder
              .field(
                "offloadRatio",
                "llamaAccelerationOffloadRatio",
                { machineDependent: true },
                "max",
              )
              .field("mainGpu", "llamaAccelerationMainGpu", { machineDependent: true }, 0)
              .field("tensorSplit", "llamaAccelerationTensorSplit", { machineDependent: true }, [
                0,
              ]),
          )
          .field("evalBatchSize", "numeric", { min: 1, int: true }, 512)
          .field(
            "flashAttention",
            "boolean",
            { isExperimental: true, warning: "config:flashAttentionWarning" },
            false,
          )
          .field("ropeFrequencyBase", "numeric", {}, 0)
          .field("ropeFrequencyScale", "numeric", {}, 0)
          .field("keepModelInMemory", "boolean", {}, true)
          .field("useFp16ForKVCache", "boolean", {}, true)
          .field("tryMmap", "boolean", {}, true),
      ),
  )
  .scope("embedding.load", builder =>
    builder
      .field("contextLength", "contextLength", { machineDependent: true }, 2048)
      .field("seed", "numeric", { int: true }, -1)
      .scope("llama", builder =>
        builder
          .scope("acceleration", builder =>
            builder
              .field(
                "offloadRatio",
                "llamaAccelerationOffloadRatio",
                { machineDependent: true },
                "max",
              )
              .field("mainGpu", "llamaAccelerationMainGpu", { machineDependent: true }, 0)
              .field("tensorSplit", "llamaAccelerationTensorSplit", { machineDependent: true }, [
                0,
              ]),
          )
          .field("evalBatchSize", "numeric", { min: 1, int: true }, 512)
          .field("ropeFrequencyBase", "numeric", {}, 0)
          .field("ropeFrequencyScale", "numeric", {}, 0)
          .field("keepModelInMemory", "boolean", {}, true)
          .field("tryMmap", "boolean", {}, true),
      ),
  )
  .scope("retrieval", builder =>
    builder
      .field("databaseFile", "string", { machineDependent: true }, "")
      .field(
        "chunkingMethod",
        "retrievalChunkingMethod",
        {},
        {
          type: "recursive-v1",
          chunkSize: 512,
          chunkOverlap: 100,
        },
      )
      .field("limit", "numeric", { min: 1, int: true }, 5)
      .field("embeddingModel", "modelIdentifier", { domain: ["embedding"] }, ""),
  )
  .build();

// ------------------------------------
//  2. Functionality scope definitions
// ------------------------------------

export const llmPredictionConfigSchematics = globalConfigSchematics.scoped("llm.prediction");

export const llmSharedPredictionConfigSchematics = llmPredictionConfigSchematics.sliced(
  "temperature",
  "maxPredictedTokens",
  "promptTemplate",
  "systemPrompt",
  "seed",
  "contextPrefill",
);

export const llmLlamaPredictionConfigSchematics = llmSharedPredictionConfigSchematics.union(
  llmPredictionConfigSchematics.sliced(
    "llama.*",
    "contextOverflowPolicy",
    "stopStrings",
    "structured",
    "topKSampling",
    "repeatPenalty",
    "minPSampling",
    "topPSampling",
  ),
);

export const llmMlxPredictionConfigSchematics = llmSharedPredictionConfigSchematics.union(
  llmPredictionConfigSchematics.sliced(
    "mlx.*",
    "contextOverflowPolicy",
    "repeatPenalty",
    "minPSampling",
    "topPSampling",
    "structured",
  ),
);

export const llmOnnxPredictionConfigSchematics = llmSharedPredictionConfigSchematics.union(
  llmPredictionConfigSchematics.sliced("onnx.*"),
);

export const llmLoadSchematics = globalConfigSchematics.scoped("llm.load");

export const llmSharedLoadConfigSchematics = llmLoadSchematics.sliced("contextLength", "seed");

export const llmLlamaLoadConfigSchematics = llmSharedLoadConfigSchematics.union(
  llmLoadSchematics.sliced("llama.*"),
);

export const llmMlxLoadConfigSchematics = llmSharedLoadConfigSchematics.union(
  llmLoadSchematics.sliced("mlx.*"),
);

export const llmOnnxLoadConfigSchematics = llmSharedLoadConfigSchematics.union(
  llmLoadSchematics.sliced("onnx.*"),
);

const llmLlamaMoeAdditionalLoadConfigSchematics = llmLoadSchematics.sliced("numExperts");

export const llmLlamaMoeLoadConfigSchematics = llmLlamaLoadConfigSchematics.union(
  llmLlamaMoeAdditionalLoadConfigSchematics,
);

export const embeddingLoadSchematics = globalConfigSchematics.scoped("embedding.load");

export const embeddingSharedLoadConfigSchematics = embeddingLoadSchematics.sliced(
  "contextLength",
  "seed",
);

export const retrievalSchematics = globalConfigSchematics.scoped("retrieval");

export const embeddingLlamaLoadConfigSchematics = embeddingSharedLoadConfigSchematics.union(
  embeddingLoadSchematics.sliced("llama.*"),
);

export const emptyConfigSchematics = new KVConfigSchematicsBuilder(kvValueTypesLibrary).build();

// ------------------
//  3. Utility types
// ------------------

/**
 * LM Studio recognized config schematics.
 */
export type GlobalConfigSchematics = typeof globalConfigSchematics;

type ValueTypeMap =
  typeof kvValueTypesLibrary extends KVFieldValueTypeLibrary<infer RValueTypeMap>
    ? RValueTypeMap
    : never;

/**
 * Any config schematics that uses the value types defined in the type library.
 */
export type TypedConfigSchematics = KVConfigSchematics<ValueTypeMap, any, any>;

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
