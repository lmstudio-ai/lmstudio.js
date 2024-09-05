import {
  ChatHistory,
  ChatMessage,
  getCurrentStack,
  makePromise,
  SimpleLogger,
  Validator,
} from "@lmstudio/lms-common";
import { routeResultToCallbacks } from "@lmstudio/lms-common/dist/resultTypes";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import { llmLlamaMoeLoadConfigSchematics } from "@lmstudio/lms-kv-config";
import {
  llmLoadModelConfigSchema,
  serializeError,
  type ChatHistoryData,
  type ChatMessageData,
  type KVConfig,
  type LLMLoadModelConfig,
  type ModelDescriptor,
  type ModelSpecifier,
  type PreprocessorUpdate,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { ModelNamespace } from "../modelShared/ModelNamespace";
import { numberToCheckboxNumeric } from "../numberToCheckboxNumeric";
import { LLMDynamicHandle } from "./LLMDynamicHandle";
import { LLMSpecificModel } from "./LLMSpecificModel";
import { promptPreprocessorSchema, type Preprocessor } from "./processing/Preprocessor";
import { type ProcessingConnector } from "./processing/ProcessingController";
import { PromptPreprocessController } from "./processor/PromptPreprocessorController";

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
  public registerPreprocessor(promptPreprocessor: Preprocessor) {
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
      /**
       * Function to cancel the preprocess task
       */
      cancel: () => void;
      /**
       * Mapping from getContext requestId to the corresponding resolve/reject functions
       */
      getContextRequests: Map<
        string,
        {
          resolve: (result: ChatHistoryData) => void;
          reject: (error: Error) => void;
        }
      >;
    }

    const tasks = new Map<string, OngoingPreprocessTask>();
    const channel = this.port.createChannel(
      "registerPreprocessor",
      {
        identifier: promptPreprocessor.identifier,
      },
      message => {
        switch (message.type) {
          case "preprocess": {
            logger.info(`Received preprocess request ${message.taskId}`);
            const abortController = new AbortController();
            const connector: ProcessingConnector = {
              abortSignal: abortController.signal,
              getContext: async () => {
                const { promise, resolve, reject } = makePromise<ChatHistoryData>();
                const requestId = `${Date.now()}-${Math.random()}`;
                const task = tasks.get(message.taskId);
                if (task === undefined) {
                  throw new Error("Preprocess task not found");
                }
                task.getContextRequests.set(requestId, { resolve, reject });
                channel.send({
                  type: "getContext",
                  taskId: message.taskId,
                  requestId,
                });
                const chatHistoryData = await promise;
                return ChatHistory.createRaw(chatHistoryData, false);
              },
              handleUpdate: update => {
                channel.send({
                  type: "update",
                  taskId: message.taskId,
                  // If the user is not using hidden methods of the controller, the updates will be
                  // of type PreprocessorUpdate.
                  update: update as PreprocessorUpdate,
                });
              },
            };
            const controller = new PromptPreprocessController(connector);
            tasks.set(message.taskId, {
              cancel: () => {
                abortController.abort();
              },
              getContextRequests: new Map(),
            });
            const userMessage = ChatMessage.createRaw(message.userMessage, false);
            promptPreprocessor
              .preprocess(controller, userMessage)
              .then(result => {
                logger.info(`Preprocess request ${message.taskId} completed`);
                const parsedReturned = z
                  .union([z.string(), z.custom<ChatMessage>(v => v instanceof ChatMessage)])
                  .safeParse(result);
                if (!parsedReturned.success) {
                  throw new Error(
                    "Prompt preprocessor returned an invalid value:" +
                      Validator.prettyPrintZod("result", parsedReturned.error),
                  );
                }
                const returned = parsedReturned.data;
                let processed: ChatMessageData;
                if (typeof returned === "string") {
                  const messageCopy = userMessage.asMutableCopy();
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
          case "getContextResult": {
            const task = tasks.get(message.taskId);
            if (task !== undefined) {
              const request = task.getContextRequests.get(message.requestId);
              if (request !== undefined) {
                routeResultToCallbacks(message.result, request.resolve, request.reject);
                task.getContextRequests.delete(message.requestId);
              }
            }
            break;
          }
        }
      },
      { stack },
    );
  }
}
