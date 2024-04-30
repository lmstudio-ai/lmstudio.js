import { z } from "zod";
import { type LLMContextOverflowPolicy, type LLMPredictionConfigBase } from "./LLMPredictionConfig";

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
export interface LLMLoadModelConfig {
  /**
   * The size of the context length in number of tokens. This will include both the prompts and the
   * responses. Once the context length is exceeded, the value set in
   * {@link LLMPredictionConfigBase#contextOverflowPolicy} is used to determine the behavior.
   *
   * See {@link LLMContextOverflowPolicy} for more information.
   */
  contextLength?: number;

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

export const llmLoadModelConfigSchema = z.object({
  contextLength: z.number().int().min(0).optional(),
  gpuOffload: llmAccelerationOffloadSchema.optional(),
});
