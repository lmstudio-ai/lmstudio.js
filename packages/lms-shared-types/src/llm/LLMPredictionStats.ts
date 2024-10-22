import { z } from "zod";
import { type KVConfig, kvConfigSchema } from "../KVConfig";

/**
 * Represents the reason why a prediction stopped. Only the following values are possible:
 *
 * - `userStopped`: The user stopped the prediction. This includes calling the `cancel` method on
 *   the `OngoingPrediction` object.
 * - `modelUnloaded`: The model was unloaded during the prediction.
 * - `failed`: An error occurred during the prediction.
 * - `eosFound`: The model predicted an end-of-sequence token, which is a way for the model to
 *   indicate that it "thinks" the sequence is complete.
 * - `stopStringFound`: A stop string was found in the prediction. (Stop strings can be specified
 *   with the `stopStrings` config option. This stop reason will only occur if the `stopStrings`
 *   config option is set to an array of strings.)
 * - `maxPredictedTokensReached`: The maximum number of tokens to predict was reached. (Length limit
 *   can be specified with the `maxPredictedTokens` config option. This stop reason will only occur
 *   if the `maxPredictedTokens` config option is set to a value other than -1.)
 * - `contextLengthReached`: The context length was reached. This stop reason will only occur if the
 *   `contextOverflowPolicy` is set to `stopAtLimit`.
 *
 * @public
 */
export type LLMPredictionStopReason =
  | "userStopped"
  | "modelUnloaded"
  | "failed"
  | "eosFound"
  | "stopStringFound"
  | "maxPredictedTokensReached"
  | "contextLengthReached";
export const llmPredictionStopReasonSchema = z.enum([
  "userStopped",
  "modelUnloaded",
  "failed",
  "eosFound",
  "stopStringFound",
  "maxPredictedTokensReached",
  "contextLengthReached"
]);

export const llmPredictionStatsSchema = z.object({
  stopReason: llmPredictionStopReasonSchema,
  tokensPerSecond: z.number().optional(),
  numGpuLayers: z.number().optional(),
  timeToFirstTokenSec: z.number().optional(),
  promptTokensCount: z.number().optional(),
  predictedTokensCount: z.number().optional(),
  totalTokensCount: z.number().optional(),
});
/** @public */
export interface LLMPredictionStats {
  /**
   * The reason why the prediction stopped.
   *
   * This is a string enum with the following possible values:
   *
   * - `userStopped`: The user stopped the prediction. This includes calling the `cancel` method on
   *   the `OngoingPrediction` object.
   * - `modelUnloaded`: The model was unloaded during the prediction.
   * - `failed`: An error occurred during the prediction.
   * - `eosFound`: The model predicted an end-of-sequence token, which is a way for the model to
   *   indicate that it "thinks" the sequence is complete.
   * - `stopStringFound`: A stop string was found in the prediction. (Stop strings can be specified
   *   with the `stopStrings` config option. This stop reason will only occur if the `stopStrings`
   *   config option is set.)
   * - `maxPredictedTokensReached`: The maximum number of tokens to predict was reached. (Length
   *   limit can be specified with the `maxPredictedTokens` config option. This stop reason will
   *   only occur if the `maxPredictedTokens` config option is set to a value other than -1.)
   * - `contextLengthReached`: The context length was reached. This stop reason will only occur if
   *   the `contextOverflowPolicy` is set to `stopAtLimit`.
   */
  stopReason: LLMPredictionStopReason;
  /**
   * The average number of tokens predicted per second.
   *
   * Note: This value can be undefined in the case of a very short prediction which results in a
   * NaN or a Infinity value.
   */
  tokensPerSecond?: number;
  /**
   * The number of GPU layers used in the prediction.
   */
  numGpuLayers?: number;
  /**
   * The time it took to predict the first token in seconds.
   */
  timeToFirstTokenSec?: number;
  /**
   * The number of tokens that were supplied.
   */
  promptTokensCount?: number;
  /**
   * The number of tokens that were predicted.
   */
  predictedTokensCount?: number;
  /**
   * The total number of tokens. This is the sum of the prompt tokens and the predicted tokens.
   */
  totalTokensCount?: number;
}

export const llmGenInfoSchema = z.object({
  indexedModelIdentifier: z.string(),
  identifier: z.string(),
  loadModelConfig: kvConfigSchema,
  predictionConfig: kvConfigSchema,
  stats: llmPredictionStatsSchema,
});
/**
 * @public
 */
export interface LLMGenInfo {
  indexedModelIdentifier: string;
  identifier: string;
  loadModelConfig: KVConfig;
  predictionConfig: KVConfig;
  stats: LLMPredictionStats;
}
