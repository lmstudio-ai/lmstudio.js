import {
  type KVConfig,
  type LLMPredictionStats,
  type ModelDescriptor,
} from "@lmstudio/lms-shared-types";

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
    public readonly modelInfo: ModelDescriptor,
    /**
     * The configuration used to load the model.
     */
    public readonly loadConfig: KVConfig,
    /**
     * The configuration used for the prediction.
     */
    public readonly predictionConfig: KVConfig,
  ) {}
}

export class StructuredPredictionResult<TStructuredOutputType = unknown> extends PredictionResult {
  public constructor(
    content: string,
    stats: LLMPredictionStats,
    modelInfo: ModelDescriptor,
    loadConfig: KVConfig,
    predictionConfig: KVConfig,
    /**
     * Parsed result of the structured output.
     */
    public readonly parsed: TStructuredOutputType,
  ) {
    super(content, stats, modelInfo, loadConfig, predictionConfig);
  }
}
