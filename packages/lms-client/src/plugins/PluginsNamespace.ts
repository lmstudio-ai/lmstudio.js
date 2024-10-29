import {
  getCurrentStack,
  type LoggerInterface,
  makePromise,
  SimpleLogger,
  Validator,
} from "@lmstudio/lms-common";
import { type PluginsPort } from "@lmstudio/lms-external-backend-interfaces";
import { type GlobalKVValueTypeMap, KVConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  type ChatMessageData,
  type PluginManifest,
  serializeError,
} from "@lmstudio/lms-shared-types";
import { pluginManifestSchema } from "@lmstudio/lms-shared-types/dist/PluginManifest";
import { z } from "zod";
import { ChatMessage } from "../ChatHistory";
import { type LMStudioClient } from "../LMStudioClient";
import { type Generator } from "./processing/Generator";
import { type Preprocessor } from "./processing/Preprocessor";
import {
  type GeneratorController,
  type PreprocessorController,
  ProcessingConnector,
  ProcessingController,
} from "./processing/ProcessingController";

/**
 * @public
 */
export interface RegisterDevelopmentPluginOpts {
  clientIdentifier: string;
  clientPasskey: string;
  manifest: PluginManifest;
}
const registerDevelopmentPluginOptsSchema = z.object({
  clientIdentifier: z.string(),
  clientPasskey: z.string(),
  manifest: pluginManifestSchema,
});

/**
 * @public
 *
 * The namespace for file-related operations. Currently no public-facing methods.
 */
export class PluginsNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    /** @internal */
    private readonly port: PluginsPort,
    private readonly client: LMStudioClient,
    private readonly validator: Validator,
    parentLogger: LoggerInterface,
    private readonly rootLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("Plugins", parentLogger);
  }

  public async registerDevelopmentPlugin(
    opts: RegisterDevelopmentPluginOpts,
  ): Promise<() => Promise<void>> {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "plugins",
      "registerDevelopmentPlugin",
      "opts",
      registerDevelopmentPluginOptsSchema,
      opts,
      stack,
    );

    const { promise, resolve } = makePromise<void>();

    const channel = this.port.createChannel(
      "registerDevelopmentPlugin",
      opts,
      message => {
        if (message.type === "ready") {
          resolve();
        }
      },
      { stack },
    );

    const end = async () => {
      channel.send({ type: "end" });
      const { promise, resolve } = makePromise<void>();
      channel.onClose.subscribeOnce(resolve);
      await promise;
    };

    await promise;

    return end;
  }

  /**
   * Sets the preprocessor to be used by the plugin represented by this client.
   */
  public setPreprocessor(preprocessor: Preprocessor) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "plugins",
      "registerPreprocessor",
      "preprocessor",
      z.function(),
      preprocessor,
      stack,
    );

    const logger = new SimpleLogger(`Preprocessor`, this.rootLogger);
    logger.info("Register to LM Studio");

    interface OngoingPreprocessTask {
      /**
       * Function to cancel the preprocess task
       */
      cancel: () => void;
      /**
       * Logger associated with this task.
       */
      taskLogger: SimpleLogger;
    }

    const tasks = new Map<string, OngoingPreprocessTask>();
    const channel = this.port.createChannel(
      "setPreprocessor",
      undefined,
      message => {
        switch (message.type) {
          case "preprocess": {
            const taskLogger = new SimpleLogger(
              `Request (${message.taskId.substring(0, 6)})`,
              logger,
            );
            taskLogger.info(`New preprocess request received.`);
            const abortController = new AbortController();
            const connector = new ProcessingConnector(
              this.port,
              abortController.signal,
              message.pci,
              message.token,
              taskLogger,
            );
            const input = ChatMessage.createRaw(message.input, /* mutable */ false);
            const controller: PreprocessorController = new ProcessingController(
              this.client,
              connector,
              message.config,
              /* shouldIncludeInputInHistory */ false,
            );
            tasks.set(message.taskId, {
              cancel: () => {
                abortController.abort();
              },
              taskLogger,
            });
            // We know the input from the channel is immutable, so we can safely pass false as the
            // second argument.
            preprocessor(controller, input.asMutableCopy())
              .then(result => {
                taskLogger.info(`Preprocess request completed.`);
                const parsedReturned = z
                  .union([z.string(), z.custom<ChatMessage>(v => v instanceof ChatMessage)])
                  .safeParse(result);
                if (!parsedReturned.success) {
                  throw new Error(
                    "Preprocessor returned an invalid value:" +
                      Validator.prettyPrintZod("result", parsedReturned.error),
                  );
                }
                const returned = parsedReturned.data;
                let processed: ChatMessageData;
                if (typeof returned === "string") {
                  const messageCopy = input.asMutableCopy();
                  messageCopy.replaceText(returned);
                  processed = messageCopy.getRaw();
                } else {
                  processed = returned.getRaw();
                }

                channel.send({
                  type: "complete",
                  taskId: message.taskId,
                  processed,
                });
              })
              .catch(error => {
                if (error.name === "AbortError") {
                  logger.info(`Request successfully aborted.`);
                  channel.send({
                    type: "aborted",
                    taskId: message.taskId,
                  });
                  return;
                }
                logger.warn(`Preprocessing failed.`, error);
                channel.send({
                  type: "error",
                  taskId: message.taskId,
                  error: serializeError(error),
                });
              })
              .finally(() => {
                tasks.delete(message.taskId);
              });
            break;
          }
          case "abort": {
            const task = tasks.get(message.taskId);
            if (task !== undefined) {
              task.taskLogger.info(`Received abort request.`);
              task.cancel();
              tasks.delete(message.taskId);
            }
            break;
          }
        }
      },
      { stack },
    );
  }

  /**
   * Sets the preprocessor to be used by the plugin represented by this client.
   */
  public setGenerator(generator: Generator) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "plugins",
      "setGenerator",
      "generator",
      z.function(),
      generator,
      stack,
    );

    const logger = new SimpleLogger(`Generator`, this.rootLogger);
    logger.info("Register to LM Studio");

    interface OngoingGenerateTask {
      /**
       * Function to cancel the generate task
       */
      cancel: () => void;
      /**
       * Logger associated with this task.
       */
      taskLogger: SimpleLogger;
    }

    const tasks = new Map<string, OngoingGenerateTask>();
    const channel = this.port.createChannel(
      "setGenerator",
      undefined,
      message => {
        switch (message.type) {
          case "generate": {
            const taskLogger = new SimpleLogger(
              `Request (${message.taskId.substring(0, 6)})`,
              logger,
            );
            taskLogger.info(`New generate request received.`);
            const abortController = new AbortController();
            const connector = new ProcessingConnector(
              this.port,
              abortController.signal,
              message.pci,
              message.token,
              taskLogger,
            );
            const controller: GeneratorController = new ProcessingController(
              this.client,
              connector,
              message.config,
              /* shouldIncludeInputInHistory */ true,
            );
            tasks.set(message.taskId, {
              cancel: () => {
                abortController.abort();
              },
              taskLogger,
            });
            // We know the input from the channel is immutable, so we can safely pass false as the
            // second argument.
            generator(controller)
              .then(() => {
                channel.send({
                  type: "complete",
                  taskId: message.taskId,
                });
              })
              .catch(error => {
                if (error.name === "AbortError") {
                  logger.info(`Request successfully aborted.`);
                  channel.send({
                    type: "aborted",
                    taskId: message.taskId,
                  });
                  return;
                }
                logger.warn(`Generation failed.`, error);
                channel.send({
                  type: "error",
                  taskId: message.taskId,
                  error: serializeError(error),
                });
              })
              .finally(() => {
                tasks.delete(message.taskId);
              });
            break;
          }
          case "abort": {
            const task = tasks.get(message.taskId);
            if (task !== undefined) {
              task.taskLogger.info(`Received abort request.`);
              task.cancel();
              tasks.delete(message.taskId);
            }
            break;
          }
        }
      },
      { stack },
    );
  }
  public async setConfigSchematics(
    configSchematics: KVConfigSchematics<GlobalKVValueTypeMap, any, any>,
  ) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "llm",
      "setConfigSchematics",
      "configSchematics",
      z.instanceof(KVConfigSchematics),
      configSchematics,
      stack,
    );

    await this.port.callRpc(
      "setConfigSchematics",
      {
        schematics: configSchematics.serialize(),
      },
      { stack },
    );
  }
  public async initCompleted() {
    const stack = getCurrentStack(1);

    await this.port.callRpc("pluginInitCompleted", undefined, { stack });
  }
}
