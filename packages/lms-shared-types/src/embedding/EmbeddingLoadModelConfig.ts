import { z } from "zod";
import {
  llmLlamaAccelerationSettingSchema,
  type LLMLlamaAccelerationSetting,
} from "../llm/LLMLoadModelConfig";

/**
 * @public
 */
export interface EmbeddingLoadModelConfig {
  // TODO: Fix type
  gpuOffload?: LLMLlamaAccelerationSetting;
  contextLength?: number;
  ropeFrequencyBase?: number;
  ropeFrequencyScale?: number;
  keepModelInMemory?: boolean;
  tryMmap?: boolean;
}
export const embeddingLoadModelConfigSchema = z.object({
  gpuOffload: llmLlamaAccelerationSettingSchema.optional(),
  contextLength: z.number().int().min(1).optional(),
  ropeFrequencyBase: z.number().optional(),
  ropeFrequencyScale: z.number().optional(),
  keepModelInMemory: z.boolean().optional(),
  tryMmap: z.boolean().optional(),
});
