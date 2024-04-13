import { z } from "zod";

/** @public */
export type LogLevel = "debug" | "info" | "warn" | "error";
export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export { DownloadedModel, downloadedModelSchema } from "./DownloadedModel";
export {
  SerializedLMSExtendedError,
  fromSerializedError,
  serializeError,
  serializedLMSExtendedErrorSchema,
} from "./Error";
export {
  Accelerator,
  AcceleratorType,
  Runtime,
  acceleratorSchema,
  acceleratorTypeSchema,
  runtimeSchema,
} from "./Runtime";
export {
  LLMAccelerationConfig,
  LLMAccelerationOffload,
  llmAccelerationConfigSchema,
  llmAccelerationOffloadSchema,
} from "./llm/LLMAccelerationConfig";
export {
  LLMChatHistory,
  LLMChatHistoryMessage,
  LLMChatHistoryRole,
  llmChatHistoryMessageSchema,
  llmChatHistoryRoleSchema,
  llmChatHistorySchema,
} from "./llm/LLMChatHistory";
export { LLMDescriptor, llmDescriptorSchema } from "./llm/LLMDescriptor";
export { LLMLoadModelConfig, llmLoadModelConfigSchema } from "./llm/LLMLoadModelConfig";
export {
  LLMModelQuery,
  LLMModelSpecifier,
  llmModelQuerySchema,
  llmModelSpecifierSchema,
} from "./llm/LLMModelSpecifier";
export {
  LLMChatPredictionConfig,
  LLMCompletionPredictionConfig,
  LLMContextOverflowPolicy,
  LLMFullPredictionConfig,
  LLMPredictionConfigBase,
  llmChatPredictionConfigSchema,
  llmCompletionPredictionConfigSchema,
  llmContextOverflowPolicySchema,
  llmFullPredictionConfigSchema,
} from "./llm/LLMPredictionConfig";
export {
  LLMPredictionStats,
  LLMPredictionStopReason,
  llmPredictionStatsSchema,
  llmPredictionStopReasonSchema,
} from "./llm/LLMPredictionStats";
export {
  LLMStructuredPredictionSetting,
  llmStructuredPredictionSettingSchema,
} from "./llm/LLMStructuredPredictionSetting";
export { reasonableKeyStringSchema } from "./reasonable";
