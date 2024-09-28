import { z } from "zod";
import { llmPromptTemplateSchema, type LLMPromptTemplate } from "./LLMPromptTemplate";
import {
  llmStructuredPredictionSettingSchema,
  type LLMStructuredPredictionSetting,
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
export interface LLMPredictionConfig {
  /**
   * Number of tokens to predict at most. If set to false, the model will predict as many tokens as it
   * wants.
   *
   * When the prediction is stopped because of this limit, the `stopReason` in the prediction stats
   * will be set to `maxPredictedTokensReached`.
   *
   * See {@link LLMPredictionStopReason} for other reasons that a prediction might stop.
   */
  maxPredictedTokens?: number | false;
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
  /**
   * TODO: Documentation
   */
  structured?: LLMStructuredPredictionSetting;
  /**
   * TODO: Documentation
   */
  topKSampling?: number;
  /**
   * TODO: Documentation
   */
  repeatPenalty?: number | false;
  /**
   * TODO: Documentation
   */
  minPSampling?: number | false;
  /**
   * TODO: Documentation
   */
  topPSampling?: number | false;
  /**
   * TODO: Documentation
   */
  cpuThreads?: number;
  /**
   * This is WIP. Will have an easier to use type in the future.
   *
   * TODO: Documentation
   */
  promptTemplate?: LLMPromptTemplate;
}
export const llmPredictionConfigSchema = z.object({
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
  promptTemplate: llmPromptTemplateSchema.optional(),
});

export interface LLMLlamaMirostatSamplingConfig {
  /**
   * 0 = disabled
   */
  version: 0 | 1 | 2;
  learningRate: number;
  targetEntropy: number;
}
export const llmLlamaMirostatSamplingConfigSchema = z.object({
  version: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  learningRate: z.number(),
  targetEntropy: z.number(),
});

/**
 * Specify a number to modify the likelihood. Specify "-inf" to prevent the token from being
 * generated.
 */
export type LLMLlamaSingleLogitBiasModification = number | "-inf";
export const llmLlamaSingleLogitBiasModificationSchema = z.union([z.number(), z.literal("-inf")]);

export type LLMLlamaLogitBiasConfig = Array<
  [token: number, modification: LLMLlamaSingleLogitBiasModification]
>;
export const llmLlamaLogitBiasConfigSchema = z.array(
  z.tuple([z.number(), llmLlamaSingleLogitBiasModificationSchema]),
);
