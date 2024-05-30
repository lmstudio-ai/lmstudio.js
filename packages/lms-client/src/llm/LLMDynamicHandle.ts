import { BufferedEvent, getCurrentStack, SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-llm-backend-interface";
import {
  llmChatHistorySchema,
  type LLMChatHistory,
  type LLMDescriptor,
  type LLMPredictionStats,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { type LLMResolvedLoadModelConfig } from "@lmstudio/lms-shared-types/dist/llm/LLMLoadModelConfig";
import {
  llmLlamaPredictionConfigSchema,
  type LLMLlamaPredictionConfig,
  type LLMPredictionConfig,
  type LLMResolvedPredictionConfig,
} from "@lmstudio/lms-shared-types/dist/llm/LLMPredictionConfig";
import { z } from "zod";
import { type LLMNamespace } from "./LLMNamespace";
import { OngoingPrediction } from "./OngoingPrediction";
import { type PredictionResult } from "./PredictionResult";

/**
 * This represents a set of requirements for a model. It is not tied to a specific model, but rather
 * to a set of requirements that a model must satisfy.
 *
 * For example, if you got the model via `client.llm.get("my-identifier")`, you will get a
 * `LLMModel` for the model with the identifier `my-identifier`. If the model is unloaded, and
 * another model is loaded with the same identifier, using the same `LLMModel` will use the new
 * model.
 *
 * @public
 */
export class LLMDynamicHandle {
  /**
   * Don't construct this on your own. Use {@link LLMNamespace#get} or {@link LLMNamespace#load}
   * instead.
   *
   * @internal
   */
  public constructor(
    /** @internal */
    private readonly llmPort: LLMPort,
    /** @internal */
    private readonly specifier: ModelSpecifier,
    /** @internal */
    private readonly validator: Validator,
    /** @internal */
    private readonly logger: SimpleLogger = new SimpleLogger(`LLMModel`),
  ) {}

  /** @internal */
  private predict(
    modelSpecifier: ModelSpecifier,
    history: LLMChatHistory,
    config: LLMPredictionConfig,
    cancelEvent: BufferedEvent<void>,
    onFragment: (fragment: string) => void,
    onFinished: (
      stats: LLMPredictionStats,
      modelInfo: LLMDescriptor,
      loadModelConfig: LLMResolvedLoadModelConfig,
      predictionConfig: LLMResolvedPredictionConfig,
    ) => void,
    onError: (error: Error) => void,
  ) {
    const channel = this.llmPort.createChannel(
      "predict",
      { modelSpecifier, history, config },
      message => {
        switch (message.type) {
          case "fragment":
            onFragment(message.fragment);
            break;
          case "success":
            onFinished(
              message.stats,
              message.modelInfo,
              message.loadModelConfig,
              message.predictionConfig,
            );
            break;
        }
      },
      { stack: getCurrentStack(2) },
    );
    cancelEvent.subscribeOnce(() => {
      channel.send({ type: "cancel" });
    });
    channel.onError.subscribeOnce(onError);
  }

  /**
   * Use the loaded model to predict text.
   *
   * This method returns an {@link OngoingPrediction} object. An ongoing prediction can be used as a
   * promise (if you only care about the final result) or as an async iterable (if you want to
   * stream the results as they are being generated).
   *
   * Example usage as a promise (Resolves to a {@link PredictionResult}):
   *
   * ```typescript
   * const result = await model.complete("When will The Winds of Winter be released?");
   * console.log(result.content);
   * ```
   *
   * Or
   *
   * ```typescript
   * model.complete("When will The Winds of Winter be released?")
   *  .then(result =\> console.log(result.content))
   *  .catch(error =\> console.error(error));
   * ```
   *
   * Example usage as an async iterable (streaming):
   *
   * ```typescript
   * for await (const fragment of model.complete("When will The Winds of Winter be released?")) {
   *   process.stdout.write(fragment);
   * }
   * ```
   *
   * If you wish to stream the result, but also getting the final prediction results (for example,
   * you wish to get the prediction stats), you can use the following pattern:
   *
   * ```typescript
   * const prediction = model.complete("When will The Winds of Winter be released?");
   * for await (const fragment of prediction) {
   *   process.stdout.write(fragment);
   * }
   * const result = await prediction;
   * console.log(result.stats);
   * ```
   *
   * @param prompt - The prompt to use for prediction.
   * @param opts - Options for the prediction.
   */
  public complete(prompt: string, config: LLMLlamaPredictionConfig = {}) {
    const stack = getCurrentStack(1);
    [prompt, config] = this.validator.validateMethodParamsOrThrow(
      "model",
      "complete",
      ["prompt", "opts"],
      [z.string(), llmLlamaPredictionConfigSchema],
      [prompt, config],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    this.predict(
      this.specifier,
      [{ role: "user", content: prompt }],
      {
        type: "llama",
        content: {
          // If the user did not specify `stopStrings`, we default to an empty array. This is to
          // prevent the model from using the value set in the preset.
          stopStrings: [],
          ...config,
        },
      },
      cancelEvent,
      fragment => push(fragment),
      (stats, modelInfo, loadModelConfig, predictionConfig) =>
        finished(stats, modelInfo, loadModelConfig, predictionConfig),
      error => failed(error),
    );
    return ongoingPrediction;
  }

  /**
   * Use the loaded model to generate a response based on the given history.
   *
   * This method returns an {@link OngoingPrediction} object. An ongoing prediction can be used as a
   * promise (if you only care about the final result) or as an async iterable (if you want to
   * stream the results as they are being generated).
   *
   * Example usage as a promise (Resolves to a {@link PredictionResult}):
   *
   * ```typescript
   * const history = [{ type: 'user', content: "When will The Winds of Winter be released?" }];
   * const result = await model.respond(history);
   * console.log(result.content);
   * ```
   *
   * Or
   *
   * ```typescript
   * const history = [{ type: 'user', content: "When will The Winds of Winter be released?" }];
   * model.respond(history)
   *  .then(result => console.log(result.content))
   *  .catch(error => console.error(error));
   * ```
   *
   * Example usage as an async iterable (streaming):
   *
   * ```typescript
   * const history = [{ type: 'user', content: "When will The Winds of Winter be released?" }];
   * for await (const fragment of model.respond(history)) {
   *   process.stdout.write(fragment);
   * }
   * ```
   *
   * If you wish to stream the result, but also getting the final prediction results (for example,
   * you wish to get the prediction stats), you can use the following pattern:
   *
   * ```typescript
   * const history = [{ type: 'user', content: "When will The Winds of Winter be released?" }];
   * const prediction = model.respond(history);
   * for await (const fragment of prediction) {
   *   process.stdout.write(fragment);
   * }
   * const result = await prediction;
   * console.log(result.stats);
   * ```
   *
   * @param history - The LLMChatHistory array to use for generating a response.
   * @param config - Options for the prediction.
   */
  public respond(history: LLMChatHistory, config: LLMLlamaPredictionConfig = {}) {
    const stack = getCurrentStack(1);
    [history, config] = this.validator.validateMethodParamsOrThrow(
      "model",
      "respond",
      ["history", "opts"],
      [llmChatHistorySchema, llmLlamaPredictionConfigSchema],
      [history, config],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    this.predict(
      this.specifier,
      history,
      { type: "llama", content: config },
      cancelEvent,
      fragment => push(fragment),
      (stats, modelInfo, loadModelConfig, predictionConfig) =>
        finished(stats, modelInfo, loadModelConfig, predictionConfig),
      error => failed(error),
    );
    return ongoingPrediction;
  }

  /**
   * Gets the information of the model that is currently associated with this `LLMModel`. If no
   * model is currently associated, this will return `undefined`.
   *
   * Note: As models are loaded/unloaded, the model associated with this `LLMModel` may change at
   * any moment.
   */
  public async getModelInfo(): Promise<LLMDescriptor | undefined> {
    const info = await this.llmPort.callRpc(
      "getModelInfo",
      { specifier: this.specifier, throwIfNotFound: false },
      { stack: getCurrentStack(1) },
    );
    if (info === undefined) {
      return undefined;
    }
    return info.descriptor;
  }
}
