import { z } from "zod";

/** @public */
export type LogLevel = "debug" | "info" | "warn" | "error";
export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export {
  DiagnosticsLogEvent,
  DiagnosticsLogEventData,
  diagnosticsLogEventDataSchema,
  diagnosticsLogEventSchema,
} from "./diagnostics/DiagnosticsLogEvent";
export { DownloadedModel, downloadedModelSchema } from "./DownloadedModel";
export {
  attachSerializedErrorData,
  ErrorDisplayData,
  errorDisplayDataSchema,
  fromSerializedError,
  SerializedLMSExtendedError,
  serializedLMSExtendedErrorSchema,
  serializeError,
} from "./Error";
export {
  LLMChatHistory,
  LLMChatHistoryMessage,
  llmChatHistoryMessageSchema,
  LLMChatHistoryRole,
  llmChatHistoryRoleSchema,
  llmChatHistorySchema,
} from "./llm/LLMChatHistory";
export { LLMDescriptor, llmDescriptorSchema } from "./llm/LLMDescriptor";
export {
  LLMLlamaAccelerationOffloadRatio,
  llmLlamaAccelerationOffloadRatioSchema,
  LLMLlamaAccelerationSetting,
  llmLlamaAccelerationSettingSchema,
  LLMLlamaLoadModelConfig,
  llmLlamaLoadModelConfigSchema,
  LLMLlamaRoPEConfig,
  llmLlamaRoPEConfigSchema,
  LLMLoadModelConfig,
  llmLoadModelConfigSchema,
  LLMResolvedLoadModelConfig,
  llmResolvedLoadModelConfigSchema,
} from "./llm/LLMLoadModelConfig";
export {
  LLMModelQuery,
  llmModelQuerySchema,
  LLMModelSpecifier,
  llmModelSpecifierSchema,
} from "./llm/LLMModelSpecifier";
export {
  LLMContextOverflowPolicy,
  llmContextOverflowPolicySchema,
  LLMLlamaPredictionConfig,
  llmLlamaPredictionConfigSchema,
  LLMPredictionConfig,
  llmPredictionConfigSchema,
  LLMResolvedPredictionConfig,
  llmResolvedPredictionConfigSchema,
} from "./llm/LLMPredictionConfig";
export {
  LLMPredictionStats,
  llmPredictionStatsSchema,
  LLMPredictionStopReason,
  llmPredictionStopReasonSchema,
} from "./llm/LLMPredictionStats";
export {
  LLMStructuredPredictionSetting,
  llmStructuredPredictionSettingSchema,
} from "./llm/LLMStructuredPredictionSetting";
export { reasonableKeyStringSchema } from "./reasonable";
export {
  Accelerator,
  acceleratorSchema,
  AcceleratorType,
  acceleratorTypeSchema,
  Runtime,
  runtimeSchema,
} from "./Runtime";
