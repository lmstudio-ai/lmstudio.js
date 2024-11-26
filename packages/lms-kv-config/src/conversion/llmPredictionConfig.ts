import { type KVConfig, type LLMPredictionConfig } from "@lmstudio/lms-shared-types";
import { globalConfigSchematics, llmPredictionConfigSchematics } from "../schema.js";
import { maybeFalseNumberToCheckboxNumeric } from "./utils.js";

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

  const toolCallStopStrings = parsed.get("llm.prediction.toolCallStopStrings");
  if (toolCallStopStrings !== undefined) {
    result.toolCallStopStrings = toolCallStopStrings;
  }

  const contextOverflowPolicy = parsed.get("llm.prediction.contextOverflowPolicy");
  if (contextOverflowPolicy !== undefined) {
    result.contextOverflowPolicy = contextOverflowPolicy;
  }

  const structured = parsed.get("llm.prediction.structured");
  if (structured !== undefined) {
    result.structured = structured;
  }

  const tools = parsed.get("llm.prediction.tools");
  if (tools !== undefined) {
    result.tools = tools;
  }

  const topKSampling = parsed.get("llm.prediction.topKSampling");
  if (topKSampling !== undefined) {
    result.topKSampling = topKSampling;
  }

  const repeatPenalty = parsed.get("llm.prediction.repeatPenalty");
  if (repeatPenalty !== undefined) {
    result.repeatPenalty = repeatPenalty.checked ? repeatPenalty.value : false;
  }

  const minPSampling = parsed.get("llm.prediction.minPSampling");
  if (minPSampling !== undefined) {
    result.minPSampling = minPSampling.checked ? minPSampling.value : false;
  }

  const topPSampling = parsed.get("llm.prediction.topPSampling");
  if (topPSampling !== undefined) {
    result.topPSampling = topPSampling.checked ? topPSampling.value : false;
  }

  const logProbs = parsed.get("llm.prediction.logProbs");
  if (logProbs !== undefined) {
    result.logProbs = logProbs.checked ? logProbs.value : false;
  }

  const cpuThreads = parsed.get("llm.prediction.llama.cpuThreads");
  if (cpuThreads !== undefined) {
    result.cpuThreads = cpuThreads;
  }

  const promptTemplate = parsed.get("llm.prediction.promptTemplate");
  if (promptTemplate !== undefined) {
    result.promptTemplate = promptTemplate;
  }

  return result;
}

export function llmPredictionConfigToKVConfig(config: LLMPredictionConfig): KVConfig {
  return llmPredictionConfigSchematics.buildPartialConfig({
    "temperature": config.temperature,
    "contextOverflowPolicy": config.contextOverflowPolicy,
    "maxPredictedTokens": maybeFalseNumberToCheckboxNumeric(config.maxPredictedTokens, 1),
    "stopStrings": config.stopStrings,
    "toolCallStopStrings": config.toolCallStopStrings,
    "structured": config.structured,
    "tools": config.tools,
    "topKSampling": config.topKSampling,
    "repeatPenalty": maybeFalseNumberToCheckboxNumeric(config.repeatPenalty, 1.1),
    "minPSampling": maybeFalseNumberToCheckboxNumeric(config.minPSampling, 0.05),
    "topPSampling": maybeFalseNumberToCheckboxNumeric(config.topPSampling, 0.95),
    "logProbs": maybeFalseNumberToCheckboxNumeric(config.logProbs, 0),
    "llama.cpuThreads": config.cpuThreads,
    "promptTemplate": config.promptTemplate,
  });
}
