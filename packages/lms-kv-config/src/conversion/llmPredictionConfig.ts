import { type KVConfig, type LLMPredictionConfig } from "@lmstudio/lms-shared-types";
import { globalConfigSchematics } from "../schema";

export function kvConfigToLLMPredictionConfig(config: KVConfig) {
  const result: LLMPredictionConfig = {};
  const parsed = globalConfigSchematics.parsePartial(config);

  const maxPredictedTokens = parsed.get("llm.prediction.maxPredictedTokens");
  if (maxPredictedTokens !== undefined) {
    result.maxPredictedTokens = maxPredictedTokens.checked ? maxPredictedTokens.value : false;
  }
  const temperature = parsed.get("llm.prediction.temperature");
  if (temperature !== undefined) {
    result.temperature = temperature;
  }

  const stopStrings = parsed.get("llm.prediction.stopStrings");
  if (stopStrings !== undefined) {
    result.stopStrings = stopStrings;
  }

  const contextOverflowPolicy = parsed.get("llm.prediction.contextOverflowPolicy");
  if (contextOverflowPolicy !== undefined) {
    result.contextOverflowPolicy = contextOverflowPolicy;
  }

  const structured = parsed.get("llm.prediction.structured");
  if (structured !== undefined) {
    result.structured = structured;
  }

  const topKSampling = parsed.get("llm.prediction.topKSampling");
  if (topKSampling !== undefined) {
    result.topKSampling = topKSampling;
  }

  const repeatPenalty = parsed.get("llm.prediction.repeatPenalty");
  if (repeatPenalty !== undefined) {
    result.repeatPenalty = repeatPenalty ? repeatPenalty.value : false;
  }

  const minPSampling = parsed.get("llm.prediction.minPSampling");
  if (minPSampling !== undefined) {
    result.minPSampling = minPSampling ? minPSampling.value : false;
  }

  const topPSampling = parsed.get("llm.prediction.topPSampling");
  if (topPSampling !== undefined) {
    result.topPSampling = topPSampling ? topPSampling.value : false;
  }

  const cpuThreads = parsed.get("llm.prediction.llama.cpuThreads");
  if (cpuThreads !== undefined) {
    result.cpuThreads = cpuThreads;
  }

  return result;
}
