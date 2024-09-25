import {
  accessMaybeMutableInternals,
  BufferedEvent,
  getCurrentStack,
  safeCallCallback,
  SimpleLogger,
  text,
  type Validator,
} from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import {
  llmPredictionConfigSchematics,
  llmSharedLoadConfigSchematics,
  llmSharedPredictionConfigSchematics,
} from "@lmstudio/lms-kv-config";
import { addKVConfigToStack } from "@lmstudio/lms-kv-config/dist/KVConfig";
import {
  type ChatHistoryData,
  type KVConfig,
  type KVConfigStack,
  type LLMApplyPromptTemplateOpts,
  llmApplyPromptTemplateOptsSchema,
  type LLMCompletionContextInput,
  llmCompletionContextInputSchema,
  type LLMPredictionConfig,
  llmPredictionConfigSchema,
  type LLMPredictionStats,
  type ModelDescriptor,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { ChatHistory, type ChatHistoryLike, chatHistoryLikeSchema } from "../ChatHistory";
import { DynamicHandle } from "../modelShared/DynamicHandle";
import { numberToCheckboxNumeric } from "../numberToCheckboxNumeric";
import { type LLMNamespace } from "./LLMNamespace";
import { OngoingPrediction } from "./OngoingPrediction";
import { type PredictionResult } from "./PredictionResult";

/**
 * Shared options for any prediction methods (`.complete`/`.respond`).
 *
 * Note, this interface extends the `LLMPredictionConfig` interface, which contains parameters that
 * you can override for the LLM. See {@link LLMPredictionConfig} for more information.
 *
 * @public
 */
export interface LLMPredictionOpts extends LLMPredictionConfig {
  // verbose?: boolean | LogLevel;
  /**
   * A callback that is called when the model is processing the prompt. The callback is called with
   * a number between 0 and 1, representing the progress of the prompt processing.
   *
   * Prompt processing progress callbacks will only be called before the first token is emitted.
   */
  onPromptProcessingProgress?: (progress: number) => void;
  /**
   * A callback that is called when the model has output the first token.
   */
  onFirstToken?: () => void;
}
export const llmPredictionOptsSchema = z.object({
  ...llmPredictionConfigSchema.shape,
  // verbose: z.union([z.boolean(), logLevelSchema]).optional(),
  onPromptProcessingProgress: z.function().optional(),
  onFirstToken: z.function().optional(),
});

type LLMPredictionExtraOpts = Omit<LLMPredictionOpts, keyof LLMPredictionConfig>;

function splitOpts(opts: LLMPredictionOpts): [LLMPredictionConfig, LLMPredictionExtraOpts] {
  const { onPromptProcessingProgress, onFirstToken, ...config } = opts;
  return [config, { onPromptProcessingProgress, onFirstToken }];
}

const noFormattingTemplate = text`
  {% for message in messages %}{{ message['content'] }}{% endfor %}
`;

function predictionConfigToKVConfig(predictionConfig: LLMPredictionConfig): KVConfig {
  return llmPredictionConfigSchematics.buildPartialConfig({
    "temperature": predictionConfig.temperature,
    "contextOverflowPolicy": predictionConfig.contextOverflowPolicy,
    "maxPredictedTokens": numberToCheckboxNumeric(predictionConfig.maxPredictedTokens, -1, 1),
    "stopStrings": predictionConfig.stopStrings,
    "structured": predictionConfig.structured,
    "topKSampling": predictionConfig.topKSampling,
    "repeatPenalty": numberToCheckboxNumeric(predictionConfig.repeatPenalty, 1, 1.1),
    "minPSampling": numberToCheckboxNumeric(predictionConfig.minPSampling, 0, 0.05),
    "topPSampling": numberToCheckboxNumeric(predictionConfig.topPSampling, 1, 0.95),
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
export class LLMDynamicHandle extends DynamicHandle<// prettier-ignore
/** @internal */ LLMPort> {
  /**
   * Don't construct this on your own. Use {@link LLMNamespace#get} or {@link LLMNamespace#load}
   * instead.
   *
   * @internal
   */
  public constructor(
    /** @internal */
    port: LLMPort,
    /** @internal */
    specifier: ModelSpecifier,
    /** @internal */
    private readonly validator: Validator,
    /** @internal */
    private readonly logger: SimpleLogger = new SimpleLogger(`LLMModel`),
  ) {
    super(port, specifier);
  }

  /** @internal */
  private readonly internalKVConfigStack: KVConfigStack = { layers: [] };

  /** @internal */
  private readonly internalIgnoreServerSessionConfig: boolean | undefined = undefined;

  /** @internal */
  private predictInternal(
    modelSpecifier: ModelSpecifier,
    history: ChatHistoryData,
    predictionConfigStack: KVConfigStack,
    cancelEvent: BufferedEvent<void>,
    extraOpts: LLMPredictionExtraOpts,
    onFragment: (fragment: string) => void,
    onFinished: (
      stats: LLMPredictionStats,
      modelInfo: ModelDescriptor,
      loadModelConfig: KVConfig,
      predictionConfig: KVConfig,
    ) => void,
    onError: (error: Error) => void,
  ) {
    let finished = false;
    let firstTokenTriggered = false;
    const channel = this.port.createChannel(
      "predict",
      {
        modelSpecifier,
        history,
        predictionConfigStack,
        ignoreServerSessionConfig: this.internalIgnoreServerSessionConfig,
      },
      message => {
        switch (message.type) {
          case "fragment":
            if (!firstTokenTriggered) {
              firstTokenTriggered = true;
              if (extraOpts.onFirstToken) {
                safeCallCallback(this.logger, "onFirstToken", extraOpts.onFirstToken, []);
              }
            }
            onFragment(message.fragment);
            break;
          case "promptProcessingProgress":
            if (extraOpts.onPromptProcessingProgress) {
              safeCallCallback(
                this.logger,
                "onPromptProcessingProgress",
                extraOpts.onPromptProcessingProgress,
                [message.progress],
              );
            }
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
  public complete(prompt: LLMCompletionContextInput, opts: LLMPredictionOpts = {}) {
    const stack = getCurrentStack(1);
    [prompt, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "complete",
      ["prompt", "opts"],
      [llmCompletionContextInputSchema, llmPredictionConfigSchema],
      [prompt, opts],
      stack,
    );
    const [config, extraOpts] = splitOpts(opts);
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    this.predictInternal(
      this.specifier,
      this.resolveCompletionContext(prompt),
      {
        layers: [
          ...this.internalKVConfigStack.layers,
          {
            layerName: "apiOverride",
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
                jinjaPromptTemplate: {
                  bosToken: "",
                  eosToken: "",
                  template: noFormattingTemplate,
                },
                stopStrings: [],
              },
            }),
          },
        ],
      },
      cancelEvent,
      extraOpts,
      fragment => push(fragment),
      (stats, modelInfo, loadModelConfig, predictionConfig) =>
        finished(stats, modelInfo, loadModelConfig, predictionConfig),
      error => failed(error),
    );
    return ongoingPrediction;
  }

  private resolveCompletionContext(contextInput: LLMCompletionContextInput): ChatHistoryData {
    return {
      messages: [
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
   * const history = [{ role: 'user', content: "When will The Winds of Winter be released?" }];
   * const result = await model.respond(history);
   * console.log(result.content);
   * ```
   *
   * Or
   *
   * ```typescript
   * const history = [{ role: 'user', content: "When will The Winds of Winter be released?" }];
   * model.respond(history)
   *  .then(result => console.log(result.content))
   *  .catch(error => console.error(error));
   * ```
   *
   * Example usage as an async iterable (streaming):
   *
   * ```typescript
   * const history = [{ role: 'user', content: "When will The Winds of Winter be released?" }];
   * for await (const fragment of model.respond(history)) {
   *   process.stdout.write(fragment);
   * }
   * ```
   *
   * If you wish to stream the result, but also getting the final prediction results (for example,
   * you wish to get the prediction stats), you can use the following pattern:
   *
   * ```typescript
   * const history = [{ role: 'user', content: "When will The Winds of Winter be released?" }];
   * const prediction = model.respond(history);
   * for await (const fragment of prediction) {
   *   process.stdout.write(fragment);
   * }
   * const result = await prediction;
   * console.log(result.stats);
   * ```
   *
   * @param history - The LLMChatHistory array to use for generating a response.
   * @param opts - Options for the prediction.
   */
  public respond(history: ChatHistoryLike, opts: LLMPredictionOpts = {}) {
    const stack = getCurrentStack(1);
    [history, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "respond",
      ["history", "opts"],
      [chatHistoryLikeSchema, llmPredictionConfigSchema],
      [history, opts],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();
    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(emitCancelEvent);
    const [config, extraOpts] = splitOpts(opts);
    this.predictInternal(
      this.specifier,
      accessMaybeMutableInternals(ChatHistory.from(history))._internalGetData(),
      addKVConfigToStack(
        this.internalKVConfigStack,
        "apiOverride",
        predictionConfigToKVConfig(config),
      ),
      cancelEvent,
      extraOpts,
      fragment => push(fragment),
      (stats, modelInfo, loadModelConfig, predictionConfig) =>
        finished(stats, modelInfo, loadModelConfig, predictionConfig),
      error => failed(error),
    );
    return ongoingPrediction;
  }

  public async unstable_getContextLength(): Promise<number> {
    const stack = getCurrentStack(1);
    const loadConfig = await this.getLoadConfig(stack);
    return llmSharedLoadConfigSchematics.access(loadConfig, "contextLength");
  }

  public async unstable_applyPromptTemplate(
    history: ChatHistoryLike,
    opts: LLMApplyPromptTemplateOpts = {},
  ): Promise<string> {
    const stack = getCurrentStack(1);
    [history, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "unstable_applyPromptTemplate",
      ["history", "opts"],
      [chatHistoryLikeSchema, llmApplyPromptTemplateOptsSchema],
      [history, opts],
      stack,
    );
    return (
      await this.port.callRpc(
        "applyPromptTemplate",
        {
          specifier: this.specifier,
          history: accessMaybeMutableInternals(ChatHistory.from(history))._internalGetData(),
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
      await this.port.callRpc(
        "tokenize",
        {
          specifier: this.specifier,
          inputString,
        },
        { stack },
      )
    ).tokens;
  }

  public async unstable_countTokens(inputString: string): Promise<number> {
    const stack = getCurrentStack(1);
    inputString = this.validator.validateMethodParamOrThrow(
      "model",
      "unstable_countTokens",
      "inputString",
      z.string(),
      inputString,
      stack,
    );
    return (
      await this.port.callRpc(
        "countTokens",
        {
          specifier: this.specifier,
          inputString,
        },
        { stack },
      )
    ).tokenCount;
  }
}
