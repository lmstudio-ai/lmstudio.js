import { z } from "zod";

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
export interface LLMPredictionConfigBase {
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
}
const llmPredictionConfigBaseSchema = z.object({
  maxPredictedTokens: z.number().int().min(-1).optional(),
  temperature: z.number().min(0).max(1).optional(),
  stopStrings: z.array(z.string()).optional(),
  contextOverflowPolicy: llmContextOverflowPolicySchema.optional(),
});

/**
 * Extra config options for a `complete` prediction.
 *
 * @public
 */
export interface LLMCompletionPredictionConfig extends LLMPredictionConfigBase {
  /**
   * The pre-prompt to use for the prediction. The pre-prompt will be formatted and prepended to the
   * input before making a prediction.
   */
  prePrompt?: string;
}

export const llmCompletionPredictionConfigSchema = llmPredictionConfigBaseSchema.extend({
  prePrompt: z.string().optional(),
});

/** @public */
export interface LLMChatPredictionConfig extends LLMPredictionConfigBase {
  /**
   * A string that will be prepended to each of the user message.
   */
  inputPrefix?: string;
  /**
   * A string that will be appended to each of the user message.
   */
  inputSuffix?: string;
}

export const llmChatPredictionConfigSchema = llmPredictionConfigBaseSchema.extend({
  inputPrefix: z.string().optional(),
  inputSuffix: z.string().optional(),
});

export type LLMFullPredictionConfig = LLMCompletionPredictionConfig & LLMChatPredictionConfig;
export const llmFullPredictionConfigSchema = z.object({
  ...llmCompletionPredictionConfigSchema.shape,
  ...llmChatPredictionConfigSchema.shape,
});
