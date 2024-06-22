import {
  BufferedEvent,
  getCurrentStack,
  SimpleLogger,
  text,
  type Validator,
} from "@lmstudio/lms-common";
import {
  llmLlamaPredictionConfigSchematics,
  llmSharedLoadConfigSchematics,
  llmSharedPredictionConfigSchematics,
} from "@lmstudio/lms-kv-config";
import { type LLMPort } from "@lmstudio/lms-llm-backend-interface";
import {
  type KVConfig,
  type KVConfigStack,
  type LLMApplyPromptTemplateOpts,
  llmApplyPromptTemplateOptsSchema,
  type LLMCompletionContextInput,
  llmCompletionContextInputSchema,
  type LLMContext,
  llmContextSchema,
  type LLMConversationContextInput,
  llmConversationContextInputSchema,
  type LLMDescriptor,
  type LLMLlamaPredictionConfig,
  llmLlamaPredictionConfigSchema,
  type LLMPredictionStats,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type LLMNamespace } from "./LLMNamespace";
import { OngoingPrediction } from "./OngoingPrediction";
import { type PredictionResult } from "./PredictionResult";

const noFormattingTemplate = text`
  {% for message in messages %}{{ message['content'] }}{% endfor %}
`;

/**
 * Translate a number to a checkbox numeric value.
 *
 * @param value - The value to translate.
 * @param uncheckedValue - The value to use when the checkbox is unchecked.
 * @param valueWhenUnchecked - The value to use when the checkbox is unchecked.
 */
function numberToCheckboxNumeric(
  value: number | undefined,
  uncheckedValue: number,
  valueWhenUnchecked: number,
): undefined | { checked: boolean; value: number } {
  if (value === undefined) {
    return undefined;
  }
  if (value === uncheckedValue) {
    return { checked: false, value: valueWhenUnchecked };
  }
  if (value !== uncheckedValue) {
    return { checked: true, value };
  }
}

function predictionConfigToKVConfig(predictionConfig: LLMLlamaPredictionConfig): KVConfig {
  return llmLlamaPredictionConfigSchematics.buildPartialConfig({
    "temperature": predictionConfig.temperature,
    "contextOverflowPolicy": predictionConfig.contextOverflowPolicy,
    "maxPredictedTokens": numberToCheckboxNumeric(predictionConfig.maxPredictedTokens, -1, 1),
    "stopStrings": predictionConfig.stopStrings,
    "structured": predictionConfig.structured,
    "llama.topKSampling": predictionConfig.topKSampling,
    "llama.repeatPenalty": numberToCheckboxNumeric(predictionConfig.repeatPenalty, 1, 1.1),
    "llama.minPSampling": numberToCheckboxNumeric(predictionConfig.minPSampling, 0, 0.05),
    "llama.topPSampling": numberToCheckboxNumeric(predictionConfig.topPSampling, 1, 0.95),
    "llama.cpuThreads": predictionConfig.cpuThreads,
  });
}

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
  private readonly internalKVConfigStack: KVConfigStack = { layers: [] };

  /** @internal */
  private predictInternal(
    modelSpecifier: ModelSpecifier,
    context: LLMContext,
    predictionConfigStack: KVConfigStack,
    cancelEvent: BufferedEvent<void>,
    onFragment: (fragment: string) => void,
    onFinished: (
      stats: LLMPredictionStats,
      modelInfo: LLMDescriptor,
      loadModelConfig: KVConfig,
      predictionConfig: KVConfig,
    ) => void,
    onError: (error: Error) => void,
  ) {
    let finished = false;
    const channel = this.llmPort.createChannel(
      "predict",
      {
        modelSpecifier,
        context,
        predictionConfigStack,
      },
      message => {
        switch (message.type) {
          case "fragment":
            onFragment(message.fragment);
            break;
          case "success":
            finished = true;
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
      if (finished) {
        return;
      }
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
  public complete(prompt: LLMCompletionContextInput, config: LLMLlamaPredictionConfig = {}) {
    const stack = getCurrentStack(1);
    [prompt, config] = this.validator.validateMethodParamsOrThrow(
      "model",
      "complete",
      ["prompt", "opts"],
      [llmCompletionContextInputSchema, llmLlamaPredictionConfigSchema],
      [prompt, config],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    this.predictInternal(
      this.specifier,
      this.resolveCompletionContext(prompt),
      {
        layers: [
          ...this.internalKVConfigStack.layers,
          {
            layerName: "inlineOverride",
            config: predictionConfigToKVConfig({
              // If the user did not specify `stopStrings`, we default to an empty array. This is to
              // prevent the model from using the value set in the preset.
              stopStrings: [],
              ...config,
            }),
          },
          {
            layerName: "completeModeFormatting",
            config: llmSharedPredictionConfigSchematics.buildPartialConfig({
              promptTemplate: {
                type: "jinja",
                bosToken: "",
                eosToken: "",
                template: noFormattingTemplate,
              },
            }),
          },
        ],
      },
      cancelEvent,
      fragment => push(fragment),
      (stats, modelInfo, loadModelConfig, predictionConfig) =>
        finished(stats, modelInfo, loadModelConfig, predictionConfig),
      error => failed(error),
    );
    return ongoingPrediction;
  }

  private resolveCompletionContext(contextInput: LLMCompletionContextInput): LLMContext {
    return {
      history: [
        {
          role: "user",
          content: [{ type: "text", text: contextInput }],
        },
      ],
    };
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
  public respond(history: LLMConversationContextInput, config: LLMLlamaPredictionConfig = {}) {
    const stack = getCurrentStack(1);
    [history, config] = this.validator.validateMethodParamsOrThrow(
      "model",
      "respond",
      ["history", "opts"],
      [llmConversationContextInputSchema, llmLlamaPredictionConfigSchema],
      [history, config],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    this.predictInternal(
      this.specifier,
      this.resolveConversationContext(history),
      {
        layers: [
          ...this.internalKVConfigStack.layers,
          {
            layerName: "inlineOverride",
            config: predictionConfigToKVConfig(config),
          },
        ],
      },
      cancelEvent,
      fragment => push(fragment),
      (stats, modelInfo, loadModelConfig, predictionConfig) =>
        finished(stats, modelInfo, loadModelConfig, predictionConfig),
      error => failed(error),
    );
    return ongoingPrediction;
  }

  private resolveConversationContext(contextInput: LLMConversationContextInput): LLMContext {
    return {
      history: contextInput.map(({ role, content }) => ({
        role,
        content: [{ type: "text", text: content }],
      })),
    };
  }

  /**
   * @alpha
   */
  public predict(context: LLMContext, config: LLMLlamaPredictionConfig) {
    const stack = getCurrentStack(1);
    [context, config] = this.validator.validateMethodParamsOrThrow(
      "model",
      "predict",
      ["context", "config"],
      [llmContextSchema, llmLlamaPredictionConfigSchema],
      [context, config],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    this.predictInternal(
      this.specifier,
      context,
      {
        layers: [
          ...this.internalKVConfigStack.layers,
          {
            layerName: "inlineOverride",
            config: predictionConfigToKVConfig(config),
          },
        ],
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

  private async getLoadConfig(stack: string): Promise<KVConfig> {
    const loadConfig = await this.llmPort.callRpc(
      "getLoadConfig",
      { specifier: this.specifier },
      { stack },
    );
    return loadConfig;
  }

  public async unstable_getContextLength(): Promise<number> {
    const stack = getCurrentStack(1);
    const loadConfig = await this.getLoadConfig(stack);
    return llmSharedLoadConfigSchematics.access(loadConfig, "contextLength");
  }

  public async unstable_applyPromptTemplate(
    context: LLMContext,
    opts: LLMApplyPromptTemplateOpts = {},
  ): Promise<string> {
    const stack = getCurrentStack(1);
    [context, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "unstable_applyPromptTemplate",
      ["context", "opts"],
      [llmContextSchema, llmApplyPromptTemplateOptsSchema],
      [context, opts],
      stack,
    );
    return (
      await this.llmPort.callRpc(
        "applyPromptTemplate",
        {
          specifier: this.specifier,
          context,
          predictionConfigStack: this.internalKVConfigStack,
          opts,
        },
        {
          stack,
        },
      )
    ).formatted;
  }

  public async unstable_tokenize(inputString: string): Promise<number[]> {
    const stack = getCurrentStack(1);
    inputString = this.validator.validateMethodParamOrThrow(
      "model",
      "unstable_tokenize",
      "inputString",
      z.string(),
      inputString,
      stack,
    );
    return (
      await this.llmPort.callRpc(
        "tokenize",
        {
          specifier: this.specifier,
          inputString,
        },
        { stack },
      )
    ).tokens;
  }
}
