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
  addKVConfigToStack,
  llmPredictionConfigToKVConfig,
  llmSharedLoadConfigSchematics,
  llmSharedPredictionConfigSchematics,
} from "@lmstudio/lms-kv-config";
import {
  type ChatHistoryData,
  type KVConfig,
  type KVConfigStack,
  type LLMApplyPromptTemplateOpts,
  llmApplyPromptTemplateOptsSchema,
  type LLMJinjaInputConfig,
  type LLMPredictionConfigInput,
  llmPredictionConfigInputSchema,
  type LLMPredictionFragment,
  type LLMPredictionStats,
  type LLMStructuredPredictionSetting,
  type ModelDescriptor,
  type ModelSpecifier,
  zodSchemaSchema,
} from "@lmstudio/lms-shared-types";
import { z, type ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatHistory, type ChatHistoryLike, chatHistoryLikeSchema } from "../ChatHistory.js";
import { DynamicHandle } from "../modelShared/DynamicHandle.js";
import { type LLMNamespace } from "./LLMNamespace.js";
import { OngoingPrediction } from "./OngoingPrediction.js";
import { type PredictionResult } from "./PredictionResult.js";

/**
 * Shared options for any prediction methods (`.complete`/`.respond`).
 *
 * Note, this interface extends the `LLMPredictionConfigInput` interface, which contains parameters
 * that you can override for the LLM. See {@link LLMPredictionConfigInput} for more information.
 *
 * @public
 */
export interface LLMPredictionOpts<TStructuredOutputType = unknown>
  extends LLMPredictionConfigInput<TStructuredOutputType> {
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
export const llmPredictionOptsSchema = llmPredictionConfigInputSchema.extend({
  onPromptProcessingProgress: z.function().optional(),
  onFirstToken: z.function().optional(),
});

type LLMPredictionExtraOpts = Omit<LLMPredictionOpts, keyof LLMPredictionConfigInput>;

function splitOpts(opts: LLMPredictionOpts): [LLMPredictionConfigInput, LLMPredictionExtraOpts] {
  const { onPromptProcessingProgress, onFirstToken, ...config } = opts;
  return [config, { onPromptProcessingProgress, onFirstToken }];
}

const noFormattingTemplate = text`
  {% for message in messages %}{{ message['content'] }}{% endfor %}
`;
const noFormattingInputConfig: LLMJinjaInputConfig = {
  messagesConfig: {
    contentConfig: {
      type: "string",
    },
  },
  useTools: false,
};

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
    onFragment: (fragment: LLMPredictionFragment) => void,
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

  private predictionConfigInputToKVConfig(config: LLMPredictionConfigInput): KVConfig {
    let structuredField: undefined | LLMStructuredPredictionSetting = undefined;
    if (typeof (config.structured as any)?.parse === "function") {
      structuredField = {
        type: "json",
        jsonSchema: zodToJsonSchema(config.structured as any),
      };
    }
    const convertedConfig = {
      ...config,
      structured: structuredField,
    };
    return llmPredictionConfigToKVConfig(convertedConfig);
  }

  private createZodParser(zodSchema: ZodSchema): (content: string) => any {
    return content => {
      try {
        return zodSchema.parse(JSON.parse(content));
      } catch (e) {
        throw new Error("Failed to parse structured output: " + JSON.stringify(content), {
          cause: e,
        });
      }
    };
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
   * for await (const { content } of model.complete("When will The Winds of Winter be released?")) {
   *   process.stdout.write(content);
   * }
   * ```
   *
   * If you wish to stream the result, but also getting the final prediction results (for example,
   * you wish to get the prediction stats), you can use the following pattern:
   *
   * ```typescript
   * const prediction = model.complete("When will The Winds of Winter be released?");
   * for await (const { content } of prediction) {
   *   process.stdout.write(content);
   * }
   * const result = await prediction;
   * console.log(result.stats);
   * ```
   *
   * @param prompt - The prompt to use for prediction.
   * @param opts - Options for the prediction.
   */
  public complete<TStructuredOutputType>(
    prompt: string,
    opts: LLMPredictionOpts<TStructuredOutputType> = {},
  ): OngoingPrediction<TStructuredOutputType> {
    const stack = getCurrentStack(1);
    [prompt, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "complete",
      ["prompt", "opts"],
      [z.string(), llmPredictionOptsSchema],
      [prompt, opts],
      stack,
    );
    const [config, extraOpts] = splitOpts(opts);
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();

    const zodSchemaParseResult = zodSchemaSchema.safeParse(config.structured);

    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(
      emitCancelEvent,
      !zodSchemaParseResult.success ? null : this.createZodParser(zodSchemaParseResult.data),
    );
    this.predictInternal(
      this.specifier,
      this.resolveCompletionContext(prompt),
      {
        layers: [
          ...this.internalKVConfigStack.layers,
          {
            layerName: "apiOverride",
            config: this.predictionConfigInputToKVConfig({
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
                  inputConfig: noFormattingInputConfig,
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

  private resolveCompletionContext(contextInput: string): ChatHistoryData {
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
   * for await (const { content } of model.respond(history)) {
   *   process.stdout.write(content);
   * }
   * ```
   *
   * If you wish to stream the result, but also getting the final prediction results (for example,
   * you wish to get the prediction stats), you can use the following pattern:
   *
   * ```typescript
   * const history = [{ role: 'user', content: "When will The Winds of Winter be released?" }];
   * const prediction = model.respond(history);
   * for await (const { content } of prediction) {
   *   process.stdout.write(content);
   * }
   * const result = await prediction;
   * console.log(result.stats);
   * ```
   *
   * @param history - The LLMChatHistory array to use for generating a response.
   * @param opts - Options for the prediction.
   */
  public respond<TStructuredOutputType>(
    history: ChatHistoryLike,
    opts: LLMPredictionOpts<TStructuredOutputType> = {},
  ): OngoingPrediction<TStructuredOutputType> {
    const stack = getCurrentStack(1);
    [history, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "respond",
      ["history", "opts"],
      [chatHistoryLikeSchema, llmPredictionOptsSchema],
      [history, opts],
      stack,
    );
    const [cancelEvent, emitCancelEvent] = BufferedEvent.create<void>();

    const zodSchemaParseResult = zodSchemaSchema.safeParse(opts.structured);

    const { ongoingPrediction, finished, failed, push } = OngoingPrediction.create(
      emitCancelEvent,
      !zodSchemaParseResult.success ? null : this.createZodParser(zodSchemaParseResult.data),
    );
    const [config, extraOpts] = splitOpts(opts);
    this.predictInternal(
      this.specifier,
      accessMaybeMutableInternals(ChatHistory.from(history))._internalGetData(),
      addKVConfigToStack(
        this.internalKVConfigStack,
        "apiOverride",
        this.predictionConfigInputToKVConfig(config),
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

  public async getContextLength(): Promise<number> {
    const stack = getCurrentStack(1);
    const loadConfig = await this.getLoadConfig(stack);
    return llmSharedLoadConfigSchematics.access(loadConfig, "contextLength");
  }

  public async applyPromptTemplate(
    history: ChatHistoryLike,
    opts: LLMApplyPromptTemplateOpts = {},
  ): Promise<string> {
    const stack = getCurrentStack(1);
    [history, opts] = this.validator.validateMethodParamsOrThrow(
      "model",
      "applyPromptTemplate",
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

  public async tokenize(inputString: string): Promise<Array<number>>;
  public async tokenize(inputStrings: Array<string>): Promise<Array<Array<number>>>;
  public async tokenize(
    inputString: string | Array<string>,
  ): Promise<Array<number> | Array<Array<number>>> {
    const stack = getCurrentStack(1);
    inputString = this.validator.validateMethodParamOrThrow(
      "model",
      "tokenize",
      "inputString",
      z.string().or(z.array(z.string())),
      inputString,
      stack,
    );
    if (Array.isArray(inputString)) {
      return (
        await Promise.all(
          inputString.map(s =>
            this.port.callRpc("tokenize", { specifier: this.specifier, inputString: s }, { stack }),
          ),
        )
      ).map(r => r.tokens);
    } else {
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
  }

  public async countTokens(inputString: string): Promise<number> {
    const stack = getCurrentStack(1);
    inputString = this.validator.validateMethodParamOrThrow(
      "model",
      "countTokens",
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

  /**
   * Starts to eagerly preload a draft model. This is useful when you want a draft model to be ready
   * for speculative decoding.
   *
   * Preloading is done on a best-effort basis and may not always succeed. It is not guaranteed that
   * the draft model is actually loaded when this method returns. Thus, this method should only be
   * used as an optimization. The actual draft model used only depends on the parameter set when
   * performing the prediction.
   */
  public async unstable_preloadDraftModel(draftModelKey: string): Promise<void> {
    const stack = getCurrentStack(1);
    draftModelKey = this.validator.validateMethodParamOrThrow(
      "model",
      "unstable_preloadDraftModel",
      "draftModelKey",
      z.string(),
      draftModelKey,
      stack,
    );
    await this.port.callRpc(
      "preloadDraftModel",
      { specifier: this.specifier, draftModelKey },
      { stack },
    );
  }
}
