import { z, type ZodType } from "zod";
import { zodSchemaSchema } from "../Zod.js";
import { llmPromptTemplateSchema, type LLMPromptTemplate } from "./LLMPromptTemplate.js";
import {
  llmStructuredPredictionSettingSchema,
  type LLMStructuredPredictionSetting,
} from "./LLMStructuredPredictionSetting.js";
import { llmToolUseSettingSchema, type LLMToolUseSetting } from "./LLMToolUseSetting.js";

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
 * How to parse reasoning sections in the model output.
 */
export interface LLMReasoningParsing {
  /**
   * Whether to enable reasoning parsing.
   */
  enabled: boolean;
  startString: string;
  endString: string;
}
export const llmReasoningParsingSchema = z.object({
  enabled: z.boolean(),
  startString: z.string(),
  endString: z.string(),
});

/**
 * Shared config for running predictions on an LLM.
 *
 * @public
 */
export interface LLMPredictionConfigInput<TStructuredOutputType = unknown> {
  /**
   * Number of tokens to predict at most. If set to false, the model will predict as many tokens as it
   * wants.
   *
   * When the prediction is stopped because of this limit, the `stopReason` in the prediction stats
   * will be set to `maxPredictedTokensReached`.
   *
   * See {@link LLMPredictionStopReason} for other reasons that a prediction might stop.
   */
  maxTokens?: number | false;
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
   * An array of strings. If the model generates one of these strings, the prediction will stop with
   * the `stopReason` `toolCalls`.
   *
   * See {@link LLMPredictionStopReason} for other reasons that a prediction might stop.
   */
  toolCallStopStrings?: Array<string>;
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
  structured?: ZodType<TStructuredOutputType> | LLMStructuredPredictionSetting;
  /**
   * TODO: Documentation
   */
  tools?: LLMToolUseSetting;
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
  xtcProbability?: number | false;
  /**
   * TODO: Documentation
   */
  xtcThreshold?: number | false;
  /**
   * TODO: Documentation
   */
  logProbs?: number | false;
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
  /**
   * The draft model to use for speculative decoding. Speculative decoding is a technique that can
   * drastically increase the generation speed (up to 3x for larger models) by paring a main model
   * with a smaller draft model.
   *
   * See here for more information: https://lmstudio.ai/docs/advanced/speculative-decoding
   *
   * You do not need to load the draft model yourself. Simply specifying its model key here is
   * enough.
   */
  draftModel?: string;
  /**
   * Warning: Experimental and subject to change.
   *
   * TODO: Documentation
   *
   * @alpha
   */
  speculativeDecodingDraftTokensCount?: number;
  /**
   * Warning: Experimental and subject to change.
   *
   * TODO: Documentation
   *
   * @alpha
   */
  speculativeDecodingMinContinueDraftingProbability?: number;
  /**
   * How to parse the reasoning sections in the model output. Only need to specify the `startString`
   * and the `endString`.
   *
   * For example, DeepSeek models use:
   *
   * ```
   * reasoningParsing: {
   *   enabled: true,
   *   startString: "<think>",
   *   endString: "</think>",
   * }
   * ```
   */
  reasoningParsing?: LLMReasoningParsing;
}
export const llmPredictionConfigInputSchema = z.object({
  maxTokens: z.number().int().min(-1).optional().or(z.literal(false)),
  temperature: z.number().min(0).optional(),
  stopStrings: z.array(z.string()).optional(),
  toolCallStopStrings: z.array(z.string()).optional(),
  contextOverflowPolicy: llmContextOverflowPolicySchema.optional(),
  structured: z.union([zodSchemaSchema, llmStructuredPredictionSettingSchema]).optional(),
  tools: llmToolUseSettingSchema.optional(),
  topKSampling: z.number().optional(),
  repeatPenalty: z.number().optional().or(z.literal(false)),
  minPSampling: z.number().optional().or(z.literal(false)),
  topPSampling: z.number().optional().or(z.literal(false)),
  cpuThreads: z.number().int().optional(),
  promptTemplate: llmPromptTemplateSchema.optional(),
  draftModel: z.string().optional(),
  speculativeDecodingDraftTokensCount: z.number().int().min(2).optional(),
  speculativeDecodingMinContinueDraftingProbability: z.number().optional(),
  reasoningParsing: llmReasoningParsingSchema.optional(),
});

export interface LLMPredictionConfig extends LLMPredictionConfigInput<any> {
  structured?: LLMStructuredPredictionSetting;
}
export const llmPredictionConfigSchema = llmPredictionConfigInputSchema.extend({
  structured: llmStructuredPredictionSettingSchema.optional(),
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
