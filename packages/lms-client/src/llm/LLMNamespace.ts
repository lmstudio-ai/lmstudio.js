import {
  getCurrentStack,
  makePrettyError,
  makePromise,
  SimpleLogger,
  text,
  type LoggerInterface,
  type Validator,
} from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-llm-backend-interface";
import {
  llmLoadModelConfigSchema,
  llmModelQuerySchema,
  logLevelSchema,
  reasonableKeyStringSchema,
  type LLMDescriptor,
  type LLMLoadModelConfig,
  type LLMModelQuery,
  type LogLevel,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { LLMDynamicHandle } from "./LLMDynamicHandle";
import { LLMSpecificModel } from "./LLMSpecificModel";

/** @public */
export interface LLMLoadModelOpts {
  /**
   * The name of the preset to use when loading the model. Preset can be downloaded/created/edited
   * in the LM Studio application.
   *
   * Presets act as the default configuration for the model. That is, when you load or inference
   * using a LLM model, the preset's configuration is used unless you override it with the `config`
   * option. Overriding happens on a per-field basis, so you can override only the fields you want.
   *
   * If no preset is specified, LM Studio will use the default preset selected for the model in the
   * My Models page. If no preset is selected for that model, the default preset for the operating
   * system is used. ("Default LM Studio macOS" or "Default LM Studio Windows).
   */
  preset?: string;

  /**
   * The identifier to use for the loaded model.
   *
   * By default, the identifier is the same as the path (1st parameter). If the identifier already
   * exists, a number will be attached. This option allows you to specify the identifier to use.
   *
   * However, when the identifier is specified and it is in use, an error will be thrown. If the
   * call is successful, it is guaranteed that the loaded model will have the specified identifier.
   */
  identifier?: string;

  /**
   * The configuration to use when loading the model. See {@link LLMLoadModelConfig} for details. By
   * default, the model is loaded with the configuration specified in the preset.
   *
   * If no preset is specified, LM Studio will use the default preset selected for the model in the
   * My Models page. If no preset is selected for that model, the default preset for the operating
   * system is used. ("Default LM Studio macOS" or "Default LM Studio Windows).
   */
  config?: LLMLoadModelConfig;

  /**
   * An `AbortSignal` to cancel the model loading. This is useful if you wish to add a functionality
   * to cancel the model loading.
   *
   * Example usage:
   *
   * ```typescript
   * const ac = new AbortController();
   * const model = await client.llm.load({
   *   model: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF",
   *   signal: ac.signal,
   * });
   *
   * // Later, to cancel the model loading
   * ac.abort();
   * ```
   *
   * AbortController/AbortSignal is the standard method for cancelling an asynchronous operation in
   * JavaScript. For more information, visit
   * https://developer.mozilla.org/en-US/docs/Web/API/AbortController
   */
  signal?: AbortSignal;

  /**
   * Controls the logging of model loading progress.
   *
   * - If set to `true`, logs progress at the "info" level.
   * - If set to `false`, no logs are emitted. This is the default.
   * - If a specific logging level is desired, it can be provided as a string. Acceptable values are
   *   "debug", "info", "warn", and "error".
   *
   * Logs are directed to the logger specified during the `LMStudioClient` construction.
   *
   * Progress logs will be disabled if an `onProgress` callback is provided.
   *
   * Default value is "info", which logs progress at the "info" level.
   */
  verbose?: boolean | LogLevel;

  /**
   * A function that is called with the progress of the model loading. The function is called with a
   * number between 0 and 1, inclusive, representing the progress of the model loading.
   *
   * If an `onProgress` callback is provided, verbose progress logs will be disabled.
   */
  onProgress?: (progress: number) => void;

  /**
   * By default, the model will automatically be unloaded when the last client with the same
   * `clientIdentifier` disconnects. If you set this option to `true`, the model will not be
   * automatically unloaded.
   *
   * This especially useful when you are a sysadmin and you are trying to make a model ready using
   * scripts. In this case, you can set this option to `true`, so you do not need to keep the client
   * connected.
   */
  noHup?: boolean;
}

const llmLoadModelOptsSchema = z.object({
  preset: z.string().optional(),
  identifier: z.string().optional(),
  config: llmLoadModelConfigSchema.optional(),
  signal: z.instanceof(AbortSignal).optional(),
  verbose: z.union([z.boolean(), logLevelSchema]).optional(),
  onProgress: z.function().optional(),
  noHup: z.boolean().optional(),
});

/** @public */
export class LLMNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    private readonly llmPort: LLMPort,
    private readonly validator: Validator,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("Llm", parentLogger);
  }
  /**
   * Load a model for inferencing. The first parameter is the model path. The second parameter is
   * an optional object with additional options. By default, the model is loaded with the default
   * preset (as selected in LM Studio) and the verbose option is set to true.
   *
   * When specifying the model path, you can use the following format:
   *
   * `<publisher>/<repo>[/model_file]`
   *
   * If `model_file` is not specified, the first (sorted alphabetically) model in the repository is
   * loaded.
   *
   * To find out what models are available, you can use the `lms ls` command, or programmatically
   * use the `client.system.listDownloadedModels` method.
   *
   * Here are some examples:
   *
   * Loading Llama 3:
   *
   * ```typescript
   * const model = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF");
   * ```
   *
   * Loading a specific quantization (q4_k_m) of Llama 3:
   *
   * ```typescript
   * const model = await client.llm.load("lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf");
   * ```
   *
   * To unload the model, you can use the `client.llm.unload` method. Additionally, when the last
   * client with the same `clientIdentifier` disconnects, all models loaded by that client will be
   * automatically unloaded.
   *
   * Once loaded, see {@link LLMDynamicHandle} for how to use the model for inferencing or other things you
   * can do with the model.
   *
   * @param path - The path of the model to load. See {@link LLMLoadModelOpts} for
   * details.
   * @param opts - Options for loading the model. See {@link LLMLoadModelOpts} for details.
   * @returns A promise that resolves to the model that can be used for inferencing
   */
  public async load(path: string, opts: LLMLoadModelOpts = {}): Promise<LLMDynamicHandle> {
    const stack = getCurrentStack(1);
    [path, opts] = this.validator.validateMethodParamsOrThrow(
      "client.llm",
      "load",
      ["path", "opts"],
      [reasonableKeyStringSchema, llmLoadModelOptsSchema],
      [path, opts],
      stack,
    );
    const { preset, identifier, signal, verbose = "info", config, onProgress, noHup } = opts;
    let lastVerboseCallTime = 0;

    const { promise, resolve, reject } = makePromise<LLMDynamicHandle>();
    const verboseLevel = typeof verbose === "boolean" ? "info" : verbose;

    const startTime = Date.now();
    if (verbose) {
      this.logger.logAtLevel(
        verboseLevel,
        'Verbose logging is enabled. To hide progress logs, set the "verbose" option to false.',
      );
    }

    const channel = this.llmPort.createChannel(
      "loadModel",
      {
        path,
        identifier,
        preset,
        config: config ?? {},
        noHup: noHup ?? false,
      },
      message => {
        switch (message.type) {
          case "success": {
            if (verbose) {
              this.logger.logAtLevel(
                verboseLevel,
                text`
                  Successfully loaded model ${path} in ${Date.now() - startTime}ms
                `,
              );
            }
            resolve(
              new LLMDynamicHandle(
                this.llmPort,
                { type: "sessionIdentifier", sessionIdentifier: message.sessionIdentifier },
                this.validator,
                this.logger,
              ),
            );
            break;
          }
          case "progress": {
            const { progress } = message;
            if (onProgress !== undefined) {
              onProgress(progress);
            } else if (verbose) {
              const now = Date.now();
              if (now - lastVerboseCallTime > 500 || progress === 1) {
                const progressText = (progress * 100).toFixed(1);
                this.logger.logAtLevel(
                  verboseLevel,
                  `Loading model ${path}, progress: ${progressText}%`,
                );
                lastVerboseCallTime = now;
              }
            }
          }
        }
      },
      { stack },
    );

    channel.onError.subscribeOnce(reject);
    signal?.addEventListener("abort", () => {
      channel.send({ type: "cancel" });
      reject(signal.reason);
    });

    return promise;
  }

  /**
   * Unload a model. Once a model is unloaded, it can no longer be used. If you wish to use the
   * model afterwards, you will need to load it with {@link LLMNamespace#loadModel} again.
   *
   * @param identifier - The identifier of the model to unload.
   */
  public unload(identifier: string) {
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamOrThrow(
      "client.llm",
      "unload",
      "identifier",
      reasonableKeyStringSchema,
      identifier,
      stack,
    );
    return this.llmPort.callRpc("unloadModel", { identifier }, { stack });
  }

  /**
   * List all the currently loaded models.
   */
  public listLoaded(): Promise<Array<LLMDescriptor>> {
    const stack = getCurrentStack(1);
    return this.llmPort.callRpc("listLoaded", undefined, { stack });
  }

  /**
   * Get a specific model that satisfies the given query. The returned model is tied to the specific
   * model at the time of the call.
   *
   * For more information on the query, see {@link LLMModelQuery}.
   *
   * @example
   *
   * If you have loaded a model with the identifier "my-model", you can use it like this:
   *
   * ```ts
   * const model = await client.llm.get({ identifier: "my-model" });
   * const prediction = model.complete("...");
   * ```
   *
   * Or just
   *
   * ```ts
   * const model = await client.llm.get("my-model");
   * const prediction = model.complete("...");
   * ```
   *
   * @example
   *
   * Use the Gemma 2B IT model (given it is already loaded elsewhere):
   *
   * ```ts
   * const model = await client.llm.get({ path: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF" });
   * const prediction = model.complete("...");
   * ```
   */
  public get(query: LLMModelQuery): Promise<LLMSpecificModel>;
  /**
   * Get a specific model by its identifier. The returned model is tied to the specific model at the
   * time of the call.
   *
   * @example
   *
   * If you have loaded a model with the identifier "my-model", you can use it like this:
   *
   * ```ts
   * const model = await client.llm.get("my-model");
   * const prediction = model.complete("...");
   * ```
   *
   */
  public get(path: string): Promise<LLMSpecificModel>;
  public async get(param: string | LLMModelQuery): Promise<LLMSpecificModel> {
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamOrThrow(
      "client.llm",
      "get",
      "param",
      z.union([reasonableKeyStringSchema, llmModelQuerySchema]),
      param,
      stack,
    );
    let query: LLMModelQuery;
    if (typeof param === "string") {
      query = {
        identifier: param,
      };
    } else {
      query = param;
    }
    const info = await this.llmPort.callRpc(
      "getModelInfo",
      {
        specifier: {
          type: "query",
          query,
        },
        throwIfNotFound: true,
      },
      { stack },
    );
    if (info === undefined) {
      throw new Error("Backend should have thrown.");
    }
    return new LLMSpecificModel(
      this.llmPort,
      info.sessionIdentifier,
      info.descriptor,
      this.validator,
      new SimpleLogger("LLMSpecificModel", this.logger),
    );
  }

  /**
   * Get a dynamic model handle for any loaded model that satisfies the given query.
   *
   * For more information on the query, see {@link LLMModelQuery}.
   *
   * Note: The returned `LLMModel` is not tied to any specific loaded model. Instead, it represents
   * a "handle for a model that satisfies the given query". If the model that satisfies the query is
   * unloaded, the `LLMModel` will still be valid, but any method calls on it will fail. And later,
   * if a new model is loaded that satisfies the query, the `LLMModel` will be usable again.
   *
   * You can use {@link LLMDynamicHandle#getModelInfo} to get information about the model that is
   * currently associated with this handle.
   *
   * @example
   *
   * If you have loaded a model with the identifier "my-model", you can use it like this:
   *
   * ```ts
   * const dh = client.llm.createDynamicHandle({ identifier: "my-model" });
   * const prediction = dh.complete("...");
   * ```
   *
   * @example
   *
   * Use the Gemma 2B IT model (given it is already loaded elsewhere):
   *
   * ```ts
   * const dh = client.llm.createDynamicHandle({ path: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF" });
   * const prediction = dh.complete("...");
   * ```
   *
   * @param query - The query to use to get the model.
   */
  public createDynamicHandle(query: LLMModelQuery): LLMDynamicHandle;
  /**
   * Get a dynamic model handle by its identifier.
   *
   * Note: The returned `LLMModel` is not tied to any specific loaded model. Instead, it represents
   * a "handle for a model with the given identifier". If the model with the given identifier is
   * unloaded, the `LLMModel` will still be valid, but any method calls on it will fail. And later,
   * if a new model is loaded with the same identifier, the `LLMModel` will be usable again.
   *
   * You can use {@link LLMDynamicHandle#getModelInfo} to get information about the model that is
   * currently associated with this handle.
   *
   * @example
   *
   * If you have loaded a model with the identifier "my-model", you can get use it like this:
   *
   * ```ts
   * const dh = client.llm.createDynamicHandle("my-model");
   * const prediction = dh.complete("...");
   * ```
   *
   * @param identifier - The identifier of the model to get.
   */
  public createDynamicHandle(identifier: string): LLMDynamicHandle;
  public createDynamicHandle(param: string | LLMModelQuery): LLMDynamicHandle {
    const stack = getCurrentStack(1);
    this.validator.validateMethodParamOrThrow(
      "client.llm",
      "createDynamicHandle",
      "param",
      z.union([reasonableKeyStringSchema, llmModelQuerySchema]),
      param,
      stack,
    );
    let query: LLMModelQuery;
    if (typeof param === "string") {
      query = {
        identifier: param,
      };
    } else {
      query = param;
    }
    if (query.path?.includes("\\")) {
      throw makePrettyError(
        text`
          Model path should not contain backslashes, even if you are on Windows. Use forward
          slashes instead.
        `,
        stack,
      );
    }
    return new LLMDynamicHandle(
      this.llmPort,
      {
        type: "query",
        query,
      },
      this.validator,
      new SimpleLogger("DynamicHandle", this.logger),
    );
  }
}
