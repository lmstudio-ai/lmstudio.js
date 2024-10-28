import {
  getCurrentStack,
  type LoggerInterface,
  SimpleLogger,
  Validator,
} from "@lmstudio/lms-common";
import { type PluginsPort } from "@lmstudio/lms-external-backend-interfaces";
import { type GlobalKVValueTypeMap, type KVConfigSchematics } from "@lmstudio/lms-kv-config";
import { type ChatMessageData, serializeError } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { ChatMessage } from "../ChatHistory";
import { type LMStudioClient } from "../LMStudioClient";
import { type GeneratorRegistration, generatorRegistrationSchema } from "./processing/Generator";
import {
  type PreprocessorRegistration,
  preprocessorRegistrationSchema,
} from "./processing/Preprocessor";
import {
  type GeneratorController,
  type PreprocessorController,
  ProcessingConnector,
  ProcessingController,
} from "./processing/ProcessingController";

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

  /**
   * Sets the preprocessor to be used by the plugin represented by this client.
   */
  public setPreprocessor(preprocessor: PreprocessorRegistration) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "llm",
      "registerPreprocessor",
      "preprocessor",
      preprocessorRegistrationSchema,
      preprocessor,
      stack,
    );

    const logger = new SimpleLogger(`Preprocessor (${preprocessor.identifier})`, this.rootLogger);
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
            preprocessor
              .preprocess(controller, input.asMutableCopy())
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
  public setGenerator(generator: GeneratorRegistration) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "llm",
      "setGenerator",
      "generator",
      generatorRegistrationSchema,
      generator,
      stack,
    );

    const logger = new SimpleLogger(`Generator (${generator.identifier})`, this.rootLogger);
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
            generator
              .generate(controller)
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
    await this.port.callRpc("setConfigSchematics", {
      schematics: configSchematics.serialize(),
    });
  }
}
