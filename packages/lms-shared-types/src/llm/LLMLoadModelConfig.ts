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
export type LLMLlamaAccelerationOffloadRatio = number | "auto" | "max" | "off";
export const llmLlamaAccelerationOffloadRatioSchema = z.union([
  z.number().min(0).max(1),
  z.literal("auto"),
  z.literal("max"),
  z.literal("off"),
]);

export type LLMLlamaAccelerationSetting = {
  ratio: LLMLlamaAccelerationOffloadRatio;
  mainGpu: number;
  tensorSplit: Array<number>;
};
export const llmLlamaAccelerationSettingSchema = z.object({
  ratio: llmLlamaAccelerationOffloadRatioSchema,
  mainGpu: z.number().int(),
  tensorSplit: z.array(z.number().int()),
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
export interface LLMLlamaLoadModelConfig {
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
  gpuOffload?: LLMLlamaAccelerationSetting;
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
  keepModelInMemory?: boolean;
  seed?: number;
  useFp16ForKVCache?: boolean;
  tryMmap?: boolean;
  numExperts?: number;
}
export const llmLlamaLoadModelConfigSchema = z.object({
  gpuOffload: llmLlamaAccelerationSettingSchema.optional(),
  contextLength: z.number().int().min(1).optional(),
  rope: llmLlamaRoPEConfigSchema.optional(),
  evalBatchSize: z.number().int().min(1).optional(),
  flashAttention: z.boolean().optional(),
  keepModelInMemory: z.boolean().optional(),
  seed: z.number().int().optional(),
  useFp16ForKVCache: z.boolean().optional(),
  tryMmap: z.boolean().optional(),
  numExperts: z.number().int().optional(),
});

export type LLMLoadModelConfig = {
  type: "llama";
  content: LLMLlamaLoadModelConfig;
};
export const llmLoadModelConfigSchema = z.object({
  type: z.literal("llama"),
  content: llmLlamaLoadModelConfigSchema,
});

/** @public */
export type LLMResolvedLoadModelConfig = {
  type: "llama";
  content: Required<LLMLlamaLoadModelConfig>;
};
export const llmResolvedLoadModelConfigSchema = z.object({
  type: z.literal("llama"),
  content: llmLlamaLoadModelConfigSchema.required(),
});
