import { z } from "zod";

/** @public */
export type LogLevel = "debug" | "info" | "warn" | "error";
export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
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
  LLMAccelerationConfig,
  llmAccelerationConfigSchema,
  LLMAccelerationOffload,
  llmAccelerationOffloadSchema,
} from "./llm/LLMAccelerationConfig";
export {
  LLMChatHistory,
  LLMChatHistoryMessage,
  llmChatHistoryMessageSchema,
  LLMChatHistoryRole,
  llmChatHistoryRoleSchema,
  llmChatHistorySchema,
} from "./llm/LLMChatHistory";
export { LLMDescriptor, llmDescriptorSchema } from "./llm/LLMDescriptor";
export { LLMLoadModelConfig, llmLoadModelConfigSchema } from "./llm/LLMLoadModelConfig";
export {
  LLMModelQuery,
  llmModelQuerySchema,
  LLMModelSpecifier,
  llmModelSpecifierSchema,
} from "./llm/LLMModelSpecifier";
export {
  LLMChatPredictionConfig,
  llmChatPredictionConfigSchema,
  LLMCompletionPredictionConfig,
  llmCompletionPredictionConfigSchema,
  LLMContextOverflowPolicy,
  llmContextOverflowPolicySchema,
  LLMFullPredictionConfig,
  llmFullPredictionConfigSchema,
  LLMPredictionConfigBase,
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
