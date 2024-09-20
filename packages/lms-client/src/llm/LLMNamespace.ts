import { getCurrentStack, SimpleLogger, Validator } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import { llmLlamaMoeLoadConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  llmLoadModelConfigSchema,
  processorInputMessageSchema,
  serializeError,
  type KVConfig,
  type LLMLoadModelConfig,
  type ModelDescriptor,
  type ModelSpecifier,
  type ProcessorInputMessage,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { ModelNamespace } from "../modelShared/ModelNamespace";
import { numberToCheckboxNumeric } from "../numberToCheckboxNumeric";
import { LLMDynamicHandle } from "./LLMDynamicHandle";
import { LLMSpecificModel } from "./LLMSpecificModel";
import { promptPreprocessorSchema, type PromptPreprocessor } from "./processor/PromptPreprocessor";
import {
  PromptPreprocessController,
  type PromptCoPreprocessor,
} from "./processor/PromptPreprocessorController";

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

  /**
   * @internal
   */
  public registerPromptPreprocessor(promptPreprocessor: PromptPreprocessor) {
    const stack = getCurrentStack(1);

    this.validator.validateMethodParamOrThrow(
      "llm",
      "registerPromptPreprocessor",
      "promptPreprocessor",
      promptPreprocessorSchema,
      promptPreprocessor,
      stack,
    );

    const logger = new SimpleLogger(
      `Prompt Preprocessor - ${promptPreprocessor.identifier}`,
      this.logger,
    );
    logger.info("Register to LM Studio");

    interface OngoingPreprocessTask {
      cancel: () => void;
    }

    const tasks = new Map<string, OngoingPreprocessTask>();
    const channel = this.port.createChannel(
      "registerPromptPreprocessor",
      {
        identifier: promptPreprocessor.identifier,
      },
      message => {
        switch (message.type) {
          case "preprocess": {
            logger.info(`Received preprocess request ${message.taskId}`);
            const coPreprocessor: PromptCoPreprocessor = {
              handleUpdate: update => {
                channel.send({
                  type: "update",
                  taskId: message.taskId,
                  update,
                });
              },
            };
            const abortController = new AbortController();
            const controller = new PromptPreprocessController(
              coPreprocessor,
              message.context,
              message.userInput,
              abortController.signal,
            );
            tasks.set(message.taskId, {
              cancel: () => {
                abortController.abort();
              },
            });
            promptPreprocessor
              .preprocess(controller)
              .then(result => {
                logger.info(`Preprocess request ${message.taskId} completed`);
                const parsedReturned = z
                  .union([z.string(), processorInputMessageSchema])
                  .safeParse(result);
                if (!parsedReturned.success) {
                  throw new Error(
                    "Prompt preprocessor returned an invalid value:" +
                      Validator.prettyPrintZod("result", parsedReturned.error),
                  );
                }
                const returned = parsedReturned.data;
                let processed: ProcessorInputMessage;
                if (typeof returned === "string") {
                  processed = {
                    role: "user",
                    text: returned,
                    files: message.userInput.files,
                  };
                } else {
                  processed = returned;
                }

                channel.send({
                  type: "complete",
                  taskId: message.taskId,
                  processed,
                });
              })
              .catch(error => {
                if (error.name === "AbortError") {
                  logger.info(`Preprocess request ${message.taskId} aborted`);
                  return;
                }
                logger.warn(`Preprocess request ${message.taskId} failed`, error);
                channel.send({
                  type: "error",
                  taskId: message.taskId,
                  error: serializeError(error),
                });
              })
              .finally(() => {
                tasks.delete(message.taskId);
                controller.end();
              });
            break;
          }
          case "cancel": {
            logger.info(`Received cancel request ${message.taskId}`);
            const task = tasks.get(message.taskId);
            if (task !== undefined) {
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
