import { z } from "zod";
import { llmAccelerationConfigSchema, type LLMAccelerationConfig } from "./LLMAccelerationConfig";
import { type LLMContextOverflowPolicy, type LLMPredictionConfigBase } from "./LLMPredictionConfig";

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
}

export const llmLoadModelConfigSchema = z.object({
  contextLength: z.number().int().min(0).optional(),
});
