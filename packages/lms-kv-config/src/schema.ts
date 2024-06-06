import { llmContextOverflowPolicySchema } from "@lmstudio/lms-shared-types";
import {
  type InferConfigSchemaKeys,
  type InferConfigSchemaMap,
  KVConfigSchematicsBuilder,
} from "./KVConfig";
import { kvValueTypesLibrary } from "./valueTypes";

export const globalConfigSchematics = new KVConfigSchematicsBuilder(kvValueTypesLibrary)
  .scope("llm.prediction", builder =>
    builder
      .field("temperature", "numeric", { min: 0, max: 1 }, 0.8)
      .fieldRefine(
        "contextOverflowPolicy",
        "selection",
        {
          options: [
            {
              value: "stopAtLimit",
              label: "Stop at limit",
            },
            {
              value: "rollingWindow",
              label: "Rolling window",
            },
            {
              value: "truncateMiddle",
              label: "Truncate middle",
            },
          ],
        },
        value => llmContextOverflowPolicySchema.parse(value),
        "stopAtLimit",
      )
      .scope("llama", builder =>
        builder
          .field("maxPredictedTokens", "numeric", { min: -1, int: true }, -1)
          .field("stopStrings", "stringArray", {}, [])
          .field("structured", "llamaStructuredOutput", undefined, {
            type: "none",
          })
          .field("topKSampling", "numeric", {}, 40)
          .field("repeatPenalty", "numeric", {}, 1.1)
          .field("minPSampling", "numeric", {}, 0.05)
          .field("topPSampling", "numeric", {}, 0.95)
          .field("cpuThreads", "numeric", { min: 1, int: true }, 4),
      ),
  )
  .scope("llm.load", builder =>
    builder.scope("llama", builder =>
      builder
        .field("contextLength", "numeric", { min: 1, int: true }, 2048)
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
        .field("seed", "numeric", { int: true }, 0)
        .field("useFp16ForKVCache", "boolean", undefined, true)
        .field("tryMmap", "boolean", undefined, true)
        .field("numExperts", "numeric", { min: 0, int: true }, 0),
    ),
  )
  .build();

export type GlobalConfigSchemaMap = InferConfigSchemaMap<typeof globalConfigSchematics>;
export type GlobalConfigSchemaKeys = InferConfigSchemaKeys<typeof globalConfigSchematics>;
export type GlobalConfigSchemaTypeForKey<TKey extends GlobalConfigSchemaKeys> =
  GlobalConfigSchemaMap[TKey]["type"];

export const llmLlamaPredictionConfigSchematics = globalConfigSchematics
  .scoped("llm.prediction")
  .sliced("llama.*", "temperature", "contextOverflowPolicy");

export const llmLlamaLoadConfigSchematics = globalConfigSchematics
  .scoped("llm.load")
  .sliced("llama.*");

export function getLLMPredictionConfigSchematics(modelCompatibilityType: "gguf") {
  switch (modelCompatibilityType) {
    case "gguf":
      return llmLlamaPredictionConfigSchematics;
    default:
      throw new Error(`Unknown model compatibility type: ${modelCompatibilityType}`);
  }
}

export function getLLMLoadConfigSchematics(modelCompatibilityType: "gguf") {
  switch (modelCompatibilityType) {
    case "gguf":
      return llmLlamaLoadConfigSchematics;
    default:
      throw new Error(`Unknown model compatibility type: ${modelCompatibilityType}`);
  }
}
