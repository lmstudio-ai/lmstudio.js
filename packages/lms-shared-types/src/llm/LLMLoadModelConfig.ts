import { z } from "zod";

/**
 * How much of the model's work should be offloaded to the GPU. The value should be between 0 and 1.
 * A value of 0 means that no layers are offloaded to the GPU, while a value of 1 means that all
 * layers (that can be offloaded) are offloaded to the GPU.
 *
 * @public
 */
export type LLMLlamaAccelerationOffloadRatio = number | "max" | "off";
export const llmLlamaAccelerationOffloadRatioSchema = z.union([
  z.number().min(0).max(1),
  z.literal("max"),
  z.literal("off"),
]);

/**
 * How to split the model across GPUs.
 * - "evenly": Splits model evenly across GPUs
 * - "favorMainGpu": Fill the main GPU first, then fill the rest of the GPUs evenly
 *
 * @public
 */
export type LLMSplitStrategy = "evenly" | "favorMainGpu";
export const llmSplitStrategySchema = z.enum(["evenly", "favorMainGpu"]);

/**
 * Settings related to offloading work to the GPU.
 *
 * @public
 */
export type GPUSetting = {
  /**
   * A number between 0 to 1 representing the ratio of the work should be distributed to the GPU,
   * where 0 means no work is distributed and 1 means all work is distributed. Can also specify the
   * string "off" to mean 0 and the string "max" to mean 1.
   */
  ratio?: LLMLlamaAccelerationOffloadRatio;
  /**
   * The index of the GPU to use as the main GPU.
   */
  mainGpu?: number;
  /**
   * How to split computation across multiple GPUs.
   */
  splitStrategy?: LLMSplitStrategy;
};
export const gpuSettingSchema = z.object({
  ratio: llmLlamaAccelerationOffloadRatioSchema.optional(),
  mainGpu: z.number().int().optional(),
  splitStrategy: llmSplitStrategySchema.optional(),
});

/**
 * Settings related to llama.cpp KV cache quantization
 *
 * @public
 */
export const llmLlamaCacheQuantizationTypes = [
  "f32",
  "f16",
  "q8_0",
  "q4_0",
  "q4_1",
  "iq4_nl",
  "q5_0",
  "q5_1",
] as const;
export type LLMLlamaCacheQuantizationType = (typeof llmLlamaCacheQuantizationTypes)[number];
export const llmLlamaCacheQuantizationTypeSchema = z.enum(llmLlamaCacheQuantizationTypes);

// MLX KV cache quantization
export const llmMlxKvCacheBitsTypes = [8, 6, 4, 3, 2] as const;
export type LLMMlxKvCacheBitsType = (typeof llmMlxKvCacheBitsTypes)[number];
export const llmMlxKvCacheBitsTypeSchema = z.union([
  z.literal(8),
  z.literal(6),
  z.literal(4),
  z.literal(3),
  z.literal(2),
]);
export const llmMlxKvCacheGroupSizeTypes = [32, 64, 128] as const;
export type LLMMlxKvCacheGroupSizeType = (typeof llmMlxKvCacheGroupSizeTypes)[number];
export const llmMlxKvCacheGroupSizeTypesSchema = z.union([
  z.literal(32),
  z.literal(64),
  z.literal(128),
]);
export const llmMlxKvCacheQuantizationSchema = z.object({
  enabled: z.boolean(),
  bits: llmMlxKvCacheBitsTypeSchema,
  groupSize: llmMlxKvCacheGroupSizeTypesSchema,
  quantizedStart: z.number().int().nonnegative(),
});

/** @public */
export interface LLMLoadModelConfig {
  /**
   * How to distribute the work to your GPUs. See {@link GPUSetting} for more information.
   *
   * @public
   */
  gpu?: GPUSetting;
  /**
   * The size of the context length in number of tokens. This will include both the prompts and the
   * responses. Once the context length is exceeded, the value set in
   * {@link LLMPredictionConfigBase#contextOverflowPolicy} is used to determine the behavior.
   *
   * See {@link LLMContextOverflowPolicy} for more information.
   */
  contextLength?: number;
  ropeFrequencyBase?: number;
  ropeFrequencyScale?: number;
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
  llamaKCacheQuantizationType?: LLMLlamaCacheQuantizationType | false;
  llamaVCacheQuantizationType?: LLMLlamaCacheQuantizationType | false;
}
export const llmLoadModelConfigSchema = z.object({
  gpuOffload: gpuSettingSchema.optional(),
  contextLength: z.number().int().min(1).optional(),
  ropeFrequencyBase: z.number().optional(),
  ropeFrequencyScale: z.number().optional(),
  evalBatchSize: z.number().int().min(1).optional(),
  flashAttention: z.boolean().optional(),
  keepModelInMemory: z.boolean().optional(),
  seed: z.number().int().optional(),
  useFp16ForKVCache: z.boolean().optional(),
  tryMmap: z.boolean().optional(),
  numExperts: z.number().int().optional(),
  llamaKCacheQuantizationType: z
    .enum(llmLlamaCacheQuantizationTypes)
    .or(z.literal(false))
    .optional(),
  llamaVCacheQuantizationType: z
    .enum(llmLlamaCacheQuantizationTypes)
    .or(z.literal(false))
    .optional(),
});
