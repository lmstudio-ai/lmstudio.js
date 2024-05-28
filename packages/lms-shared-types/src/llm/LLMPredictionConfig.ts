import { z } from "zod";
import {
  type LLMStructuredPredictionSetting,
  llmStructuredPredictionSettingSchema,
} from "./LLMStructuredPredictionSetting";

/**
 * Behavior for when the generated tokens length exceeds the context window size. Only the following
 * values are allowed:
 *
 * - `stopAtLimit`: Stop the prediction when the generated tokens length exceeds the context window
 *   size. If the generation is stopped because of this limit, the `stopReason` in the prediction
 *   stats will be set to `contextLengthReached`.
 * - `truncateMiddle`: Keep the system prompt and the first user message, truncate middle.
 * - `rollingWindow`: Maintain a rolling window and truncate past messages.
 *
 * @public
 */
export type LLMContextOverflowPolicy = "stopAtLimit" | "truncateMiddle" | "rollingWindow";
export const llmContextOverflowPolicySchema = z.enum([
  "stopAtLimit",
  "truncateMiddle",
  "rollingWindow",
]);

/**
 * Shared config for running predictions on an LLM.
 *
 * @public
 */
export interface LLMLlamaPredictionConfig {
  /**
   * Number of tokens to predict at most. If set to -1, the model will predict as many tokens as it
   * wants.
   *
   * When the prediction is stopped because of this limit, the `stopReason` in the prediction stats
   * will be set to `maxPredictedTokensReached`.
   *
   * See {@link LLMPredictionStopReason} for other reasons that a prediction might stop.
   */
  maxPredictedTokens?: number;
  /**
   * The temperature parameter for the prediction model. A higher value makes the predictions more
   * random, while a lower value makes the predictions more deterministic. The value should be
   * between 0 and 1.
   */
  temperature?: number;
  /**
   * An array of strings. If the model generates one of these strings, the prediction will stop.
   *
   * When the prediction is stopped because of this limit, the `stopReason` in the prediction stats
   * will be set to `stopStringFound`.
   *
   * See {@link LLMPredictionStopReason} for other reasons that a prediction might stop.
   */
  stopStrings?: Array<string>;
  /**
   * The behavior for when the generated tokens length exceeds the context window size. The allowed
   * values are:
   *
   * - `stopAtLimit`: Stop the prediction when the generated tokens length exceeds the context
   *   window size. If the generation is stopped because of this limit, the `stopReason` in the
   *   prediction stats will be set to `contextLengthReached`
   * - `truncateMiddle`: Keep the system prompt and the first user message, truncate middle.
   * - `rollingWindow`: Maintain a rolling window and truncate past messages.
   */
  contextOverflowPolicy?: LLMContextOverflowPolicy;
  structured?: LLMStructuredPredictionSetting;
  topKSampling?: number;
  repeatPenalty?: number;
  minPSampling?: number;
  topPSampling?: number;
  cpuThreads?: number;
}
export const llmLlamaPredictionConfigSchema = z.object({
  maxPredictedTokens: z.number().int().min(-1).optional(),
  temperature: z.number().min(0).max(1).optional(),
  stopStrings: z.array(z.string()).optional(),
  contextOverflowPolicy: llmContextOverflowPolicySchema.optional(),
  structured: llmStructuredPredictionSettingSchema.optional(),
  topKSampling: z.number().optional(),
  repeatPenalty: z.number().optional(),
  minPSampling: z.number().optional(),
  topPSampling: z.number().optional(),
  cpuThreads: z.number().optional(),
});

export type LLMPredictionConfig = {
  type: "llama";
  content: LLMLlamaPredictionConfig;
};
export const llmPredictionConfigSchema = z.object({
  type: z.literal("llama"),
  content: llmLlamaPredictionConfigSchema,
});

/** @public */
export type LLMResolvedPredictionConfig = {
  type: "llama";
  content: Required<LLMLlamaPredictionConfig>;
};
export const llmResolvedPredictionConfigSchema = z.object({
  type: z.literal("llama"),
  content: llmLlamaPredictionConfigSchema.required(),
});
