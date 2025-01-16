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
 * - "singleGpu": The model is run on a single GPU.
 * - "layer": Splits layers and KV across GPUs.
 * - "row": Splits layers and KV across GPUs, use tensor parallelism if supported
 *
 * @public
 */
export type LLMSplitMode = "singleGpu" | "layer" | "row";
export const llmSplitModeSchema = z.enum(["singleGpu", "layer", "row"]);

/**
 * Settings related to offloading work to the GPU.
 *
 * @public
 */
export type LLMLlamaAccelerationSetting = {
  ratio: LLMLlamaAccelerationOffloadRatio;
  mainGpu: number;
  tensorSplit: Array<number>;
  splitMode: LLMSplitMode;
};
export const llmLlamaAccelerationSettingSchema = z.object({
  ratio: llmLlamaAccelerationOffloadRatioSchema,
  mainGpu: z.number().int(),
  tensorSplit: z.array(z.number().int()),
  splitMode: llmSplitModeSchema,
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

/** @public */
export interface LLMLoadModelConfig {
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
  gpuOffload: llmLlamaAccelerationSettingSchema.optional(),
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
