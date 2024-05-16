import { z } from "zod";

/**
 * How much of the model's work should be offloaded to the GPU. The value should be between 0 and 1.
 * A value of 0 means that no layers are offloaded to the GPU, while a value of 1 means that all
 * layers (that can be offloaded) are offloaded to the GPU.
 *
 * Alternatively, the value can be set to "auto", which means it will be determined automatically.
 * (Currently uses the value in the preset.)
 *
 * @public
 */
export type LLMAccelerationOffload = number | "auto" | "max" | "off";
export const llmAccelerationOffloadSchema = z.union([
  z.number().min(0).max(1),
  z.literal("auto"),
  z.literal("max"),
  z.literal("off"),
]);

/** @public */
export interface LLMLoadModelConfigBase {
  /**
   * How much of the model's work should be offloaded to the GPU. The value should be between 0 and 1.
   * A value of 0 means that no layers are offloaded to the GPU, while a value of 1 means that all
   * layers (that can be offloaded) are offloaded to the GPU.
   *
   * Alternatively, the value can be set to "auto", which means it will be determined automatically.
   * (Currently uses the value in the preset.)
   *
   * @public
   */
  gpuOffload?: LLMAccelerationOffload;
}
export const llmLoadModelConfigBaseSchema = z.object({
  gpuOffload: llmAccelerationOffloadSchema.optional(),
});

/** @public */
export interface LLMLlamaRoPEConfig {
  frequencyScale: number;
  frequencyBase: number;
}
export const llmLlamaRoPEConfigSchema = z.object({
  frequencyScale: z.number().min(0),
  frequencyBase: z.number().min(0),
});

/** @public */
export interface LLMLlamaLoadModelConfig extends LLMLoadModelConfigBase {
  modelType?: "llama";
  /**
   * The size of the context length in number of tokens. This will include both the prompts and the
   * responses. Once the context length is exceeded, the value set in
   * {@link LLMPredictionConfigBase#contextOverflowPolicy} is used to determine the behavior.
   *
   * See {@link LLMContextOverflowPolicy} for more information.
   */
  contextLength?: number;
  /**
   * Rotary Positional Encoding (RoPE) related configuration.
   */
  rope?: LLMLlamaRoPEConfig;
  /**
   * Prompt evaluation batch size.
   */
  evalBatchSize?: number;
  flashAttention?: boolean;
}
export const llmLlamaLoadModelConfigSchema = llmLoadModelConfigBaseSchema.extend({
  modelType: z.literal("llama").optional(),
  contextLength: z.number().int().min(1).optional(),
  rope: llmLlamaRoPEConfigSchema.optional(),
  evalBatchSize: z.number().int().min(1).optional(),
  flashAttention: z.boolean().optional(),
});

/** @public */
export type LLMLoadModelConfig = LLMLlamaLoadModelConfig;
export const llmLoadModelConfigSchema = llmLlamaLoadModelConfigSchema;

/** @public */
export type LLMResolvedLoadModelConfig = Required<LLMLoadModelConfig>;
export const llmResolvedLoadModelConfigSchema = llmLlamaLoadModelConfigSchema.required();
