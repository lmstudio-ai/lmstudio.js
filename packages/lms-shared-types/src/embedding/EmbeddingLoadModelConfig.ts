import { z } from "zod";
import { gpuSettingSchema, type GPUSetting } from "../llm/LLMLoadModelConfig.js";

/**
 * @public
 */
export interface EmbeddingLoadModelConfig {
  // TODO: Fix type
  gpu?: GPUSetting;
  contextLength?: number;
  ropeFrequencyBase?: number;
  ropeFrequencyScale?: number;
  keepModelInMemory?: boolean;
  tryMmap?: boolean;
}
export const embeddingLoadModelConfigSchema = z.object({
  gpu: gpuSettingSchema.optional(),
  contextLength: z.number().int().min(1).optional(),
  ropeFrequencyBase: z.number().optional(),
  ropeFrequencyScale: z.number().optional(),
  keepModelInMemory: z.boolean().optional(),
  tryMmap: z.boolean().optional(),
});
