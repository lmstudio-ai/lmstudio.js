import { type LLMDescriptor, type LLMPredictionStats } from "@lmstudio/lms-shared-types";
import { type LLMResolvedLoadModelConfig } from "@lmstudio/lms-shared-types/dist/llm/LLMLoadModelConfig";
import { type LLMResolvedPredictionConfig } from "@lmstudio/lms-shared-types/dist/llm/LLMPredictionConfig";

/**
 * Represents the result of a prediction.
 *
 * The most notably property is {@link PredictionResult#content}, which contains the generated text.
 * Additionally, the {@link PredictionResult#stats} property contains statistics about the
 * prediction.
 *
 * @public
 */
export class PredictionResult {
  public constructor(
    /**
     * The newly generated text as predicted by the LLM.
     */
    public readonly content: string,
    /**
     * Statistics about the prediction.
     */
    public readonly stats: LLMPredictionStats,
    /**
     * Information about the model used for the prediction.
     */
    public readonly modelInfo: LLMDescriptor,
    /**
     * The configuration used to load the model.
     */
    public readonly loadConfig: LLMResolvedLoadModelConfig,
    /**
     * The configuration used for the prediction.
     */
    public readonly predictionConfig: LLMResolvedPredictionConfig,
  ) {}
}
