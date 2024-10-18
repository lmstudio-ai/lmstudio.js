import { getCurrentStack, SimpleLogger, Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import { llmLlamaMoeLoadConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  llmLoadModelConfigSchema,
  serializeError,
  type ChatMessageData,
  type KVConfig,
  type LLMLoadModelConfig,
  type ModelDescriptor,
  type ModelSpecifier,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { ChatMessage } from "../ChatHistory";
import { ModelNamespace } from "../modelShared/ModelNamespace";
import { numberToCheckboxNumeric } from "../numberToCheckboxNumeric";
import { LLMDynamicHandle } from "./LLMDynamicHandle";
import { LLMSpecificModel } from "./LLMSpecificModel";
import { generatorSchema, type Generator } from "./processing/Generator";
import { preprocessorSchema, type Preprocessor } from "./processing/Preprocessor";
import {
  ProcessingConnector,
  ProcessingController,
  type GeneratorController,
  type PreprocessorController,
} from "./processing/ProcessingController";

/** @public */
export class LLMNamespace extends ModelNamespace<
  /** @internal */
  LLMPort,
  LLMLoadModelConfig,
  LLMDynamicHandle,
  LLMSpecificModel
> {
  /** @internal */
  protected override readonly namespace = "llm";
  /** @internal */
  protected override readonly defaultLoadConfig = {};
  /** @internal */
  protected override readonly loadModelConfigSchema = llmLoadModelConfigSchema;
  /** @internal */
  protected override loadConfigToKVConfig(config: LLMLoadModelConfig): KVConfig {
    return llmLlamaMoeLoadConfigSchematics.buildPartialConfig({
      "contextLength": config.contextLength,
      "llama.evalBatchSize": config.evalBatchSize,
      "llama.acceleration.offloadRatio": config.gpuOffload?.ratio,
      "llama.acceleration.mainGpu": config.gpuOffload?.mainGpu,
      "llama.acceleration.tensorSplit": config.gpuOffload?.tensorSplit,
      "llama.flashAttention": config.flashAttention,
      "llama.ropeFrequencyBase": numberToCheckboxNumeric(config.ropeFrequencyBase, 0, 0),
      "llama.ropeFrequencyScale": numberToCheckboxNumeric(config.ropeFrequencyScale, 0, 0),
      "llama.keepModelInMemory": config.keepModelInMemory,
      "seed": numberToCheckboxNumeric(config.seed, -1, 0),
      "llama.useFp16ForKVCache": config.useFp16ForKVCache,
      "llama.tryMmap": config.tryMmap,
      "numExperts": config.numExperts,
    });
  }
  /** @internal */
  protected override createDomainSpecificModel(
    port: LLMPort,
    instanceReference: string,
    descriptor: ModelDescriptor,
    validator: Validator,
    logger: SimpleLogger,
  ): LLMSpecificModel {
    return new LLMSpecificModel(port, instanceReference, descriptor, validator, logger);
  }
  /** @internal */
  protected override createDomainDynamicHandle(
    port: LLMPort,
    specifier: ModelSpecifier,
    validator: Validator,
    logger: SimpleLogger,
  ): LLMDynamicHandle {
    return new LLMDynamicHandle(port, specifier, validator, logger);
  }

  public registerPreprocessor(preprocessor: Preprocessor) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "llm",
      "registerPreprocessor",
      "preprocessor",
      preprocessorSchema,
      preprocessor,
      stack,
    );

    const logger = new SimpleLogger(`Preprocessor (${preprocessor.identifier})`, this.logger);
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
      "registerPreprocessor",
      {
        identifier: preprocessor.identifier,
      },
      message => {
        switch (message.type) {
          case "preprocess": {
            const taskLogger = new SimpleLogger(`Request (${message.taskId})`, logger);
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
  public registerGenerator(generator: Generator) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "llm",
      "registerGenerator",
      "generator",
      generatorSchema,
      generator,
      stack,
    );

    const logger = new SimpleLogger(`Generator (${generator.identifier})`, this.logger);
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
      "registerGenerator",
      {
        identifier: generator.identifier,
      },
      message => {
        switch (message.type) {
          case "generate": {
            const taskLogger = new SimpleLogger(`Request (${message.taskId})`, logger);
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
}
