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
export type LLMAccelerationOffload = number | "auto";
export const llmAccelerationOffloadSchema = z.union([z.number().min(0).max(1), z.literal("auto")]);

/**
 * Config related to the acceleration method for the model, such as offloading to the GPU.
 *
 * @public
 */
export interface LLMAccelerationConfig {
  /**
   * How much of the model's work should be offloaded to the GPU. It should be between 0 and 1. A
   * value of 0 means that no layers are offloaded to the GPU, while a value of 1 means that all
   * layers (that can be offloaded) are offloaded to the GPU.
   *
   * Alternatively, the value can be set to "auto", which means it will be determined automatically.
   * (Currently uses the value in the preset.)
   */
  offload: LLMAccelerationOffload;
}
export const llmAccelerationConfigSchema = z.object({
  offload: z.union([llmAccelerationOffloadSchema, z.literal("auto")]),
});
