import { type SimpleLogger } from "@lmstudio/lms-common";
import { type LLMPort } from "@lmstudio/lms-external-backend-interfaces";
import {
  type CitationSource,
  type LLMGenInfo,
  type ProcessingUpdate,
  type StatusStepState,
} from "@lmstudio/lms-shared-types";
import { ChatHistory, type ChatMessage } from "../../ChatHistory";
import { type OngoingPrediction } from "../OngoingPrediction";
import { type PredictionResult } from "../PredictionResult";

function stringifyAny(message: any) {
  switch (typeof message) {
    case "string":
      return message;
    case "number":
      return message.toString();
    case "boolean":
      return message ? "true" : "false";
    case "undefined":
      return "undefined";
    case "object":
      if (message === null) {
        return "null";
      }
      if (message instanceof Error) {
        return message.stack;
      }
      return JSON.stringify(message, null, 2);
    case "bigint":
      return message.toString();
    case "symbol":
      return message.toString();
    case "function":
      return message.toString();
    default:
      return "unknown";
  }
}

function concatenateDebugMessages(...messages: Array<any>) {
  return messages.map(stringifyAny).join(" ");
}

function createId() {
  return `${Date.now()}-${Math.random()}`;
}

export class ProcessingConnector {
  public constructor(
    private readonly llmPort: LLMPort,
    public readonly abortSignal: AbortSignal,
    private readonly processingContextIdentifier: string,
    private readonly token: string,
    private readonly logger: SimpleLogger,
  ) {}
  public handleUpdate(update: ProcessingUpdate) {
    this.llmPort
      .callRpc("processingHandleUpdate", {
        pci: this.processingContextIdentifier,
        token: this.token,
        update,
      })
      .catch(error => {
        this.logger.error("Failed to send update", error);
      });
  }
  public async getHistory(): Promise<ChatHistory> {
    const chatHistoryData = await this.llmPort.callRpc("processingGetHistory", {
      pci: this.processingContextIdentifier,
      token: this.token,
    });
    // We know the result of callRpc is immutable, so we can safely pass false as the second
    // argument.
    return ChatHistory.createRaw(chatHistoryData, /* mutable */ false);
  }
}

interface ProcessingControllerHandle {
  abortSignal: AbortSignal;
  sendUpdate: (update: ProcessingUpdate) => void;
}

/**
 * @public
 */
export interface CreateContentBlockOpts {
  includeInContext?: boolean;
}

/**
 * @public
 */
export class ProcessingController {
  /** @internal */
  private readonly processingControllerHandle: ProcessingControllerHandle;
  public readonly abortSignal: AbortSignal;

  /** @internal */
  public constructor(
    /** @internal */
    private readonly connector: ProcessingConnector,
    /** @internal */
    private readonly input: ChatMessage,
  ) {
    this.abortSignal = connector.abortSignal;
    this.processingControllerHandle = {
      abortSignal: connector.abortSignal,
      sendUpdate: update => connector.handleUpdate(update),
    };
  }

  private sendUpdate(update: ProcessingUpdate) {
    this.processingControllerHandle.sendUpdate(update);
  }

  /**
   * Gets the history of the current prediction process. Does not include the latest user input.
   */
  public async getHistory() {
    return await this.connector.getHistory();
  }

  /**
   * Gets a mutable copy of the current prediction process. This is mainly a convenience method.
   * Changes made to the mutable copy will not be reflected in the original history.
   */
  public async getMutableCopyOfHistory() {
    return (await this.getHistory()).asMutableCopy();
  }

  /**
   * Gets the history of the current prediction process, including the latest user input.
   */
  public async getHistoryWithInput() {
    return (await this.getMutableCopyOfHistoryWithInput()).asImmutableCopy();
  }

  /**
   * Gets a mutable copy of the current prediction process, including the latest user input. This is
   * mainly a convenience method. Changes made to the mutable copy will not be reflected in the
   * original history.
   */
  public async getMutableCopyOfHistoryWithInput() {
    const history = await this.getMutableCopyOfHistory();
    history.append(this.input);
    return history;
  }

  public createStatus(initialState: StatusStepState): PredictionProcessStatusController {
    const id = createId();
    this.sendUpdate({
      type: "status.create",
      id,
      state: initialState,
    });
    const statusController = new PredictionProcessStatusController(
      this.processingControllerHandle,
      initialState,
      id,
    );
    return statusController;
  }

  public createCitationBlock(
    citedText: string,
    source: CitationSource,
  ): PredictionProcessCitationBlockController {
    const id = createId();
    this.sendUpdate({
      type: "citationBlock.create",
      id,
      citedText,
      source,
    });
    const citationBlockController = new PredictionProcessCitationBlockController(
      this.processingControllerHandle,
      id,
    );
    return citationBlockController;
  }

  /**
   * @internal
   */
  public createDebugInfoBlock(debugInfo: string): PredictionProcessDebugInfoBlockController {
    const id = createId();
    this.sendUpdate({
      type: "debugInfoBlock.create",
      id,
      debugInfo,
    });
    const debugInfoBlockController = new PredictionProcessDebugInfoBlockController(
      this.processingControllerHandle,
      id,
    );
    return debugInfoBlockController;
  }

  public createContentBlock({
    includeInContext = true,
  }: CreateContentBlockOpts): PredictionProcessContentBlockController {
    const id = createId();
    this.sendUpdate({
      type: "contentBlock.create",
      id,
      includeInContext,
    });
    const contentBlockController = new PredictionProcessContentBlockController(
      this.processingControllerHandle,
      id,
    );
    return contentBlockController;
  }

  public debug(...messages: Array<any>) {
    this.createDebugInfoBlock(concatenateDebugMessages(...messages));
  }

  /**
   * Throws an error if the prediction process has been aborted. Sprinkle this throughout your code
   * to ensure that the prediction process is aborted as soon as possible.
   */
  public guardAbort() {
    if (this.abortSignal.aborted) {
      throw this.abortSignal.reason;
    }
  }
}

/**
 * @public
 */
export type PreprocessorController = Omit<ProcessingController, "createContentBlock">;
/**
 * @public
 */
export type GeneratorController = Omit<ProcessingController, never>;

/**
 * Controller for a status block in the prediction process.
 *
 * @public
 */
export class PredictionProcessStatusController {
  /** @internal */
  public constructor(
    /** @internal */
    private readonly handle: ProcessingControllerHandle,
    initialState: StatusStepState,
    private readonly id: string,
    private readonly indentation: number = 0,
  ) {
    this.lastState = initialState;
  }
  private lastSubStatus: PredictionProcessStatusController = this;
  private lastState: StatusStepState;
  public setText(text: string) {
    this.lastState.text = text;
    this.handle.sendUpdate({
      type: "status.update",
      id: this.id,
      state: this.lastState,
    });
  }
  public setState(state: StatusStepState) {
    this.lastState = state;
    this.handle.sendUpdate({
      type: "status.update",
      id: this.id,
      state,
    });
  }
  private getNestedLastSubStatusBlockId() {
    let current = this.lastSubStatus;
    while (current !== current.lastSubStatus) {
      current = current.lastSubStatus;
    }
    return current.id;
  }
  public addSubStatus(initialState: StatusStepState): PredictionProcessStatusController {
    const id = createId();
    this.handle.sendUpdate({
      type: "status.create",
      id,
      state: initialState,
      location: {
        type: "afterId",
        id: this.getNestedLastSubStatusBlockId(),
      },
      indentation: this.indentation + 1,
    });
    const controller = new PredictionProcessStatusController(
      this.handle,
      initialState,
      id,
      this.indentation + 1,
    );
    this.lastSubStatus = controller;
    return controller;
  }
}

/**
 * Controller for a citation block in the prediction process. Currently cannot do anything.
 *
 * @public
 */
export class PredictionProcessCitationBlockController {
  /** @internal */
  public constructor(
    /** @internal */
    private readonly handle: ProcessingControllerHandle,
    private readonly id: string,
  ) {}
}

/**
 * Controller for a debug info block in the prediction process. Currently cannot do anything.
 *
 * @public
 */
export class PredictionProcessDebugInfoBlockController {
  /** @internal */
  public constructor(
    /** @internal */
    private readonly handle: ProcessingControllerHandle,
    private readonly id: string,
  ) {}
}

/**
 * @public
 *
 * TODO: Documentation
 */
export class PredictionProcessContentBlockController {
  /** @internal */
  public constructor(
    /** @internal */
    private readonly handle: ProcessingControllerHandle,
    private readonly id: string,
  ) {}
  public appendText(text: string) {
    this.handle.sendUpdate({
      type: "contentBlock.appendText",
      id: this.id,
      text,
    });
  }
  public attachGenInfo(genInfo: LLMGenInfo) {
    this.handle.sendUpdate({
      type: "contentBlock.attachGenInfo",
      id: this.id,
      genInfo,
    });
  }
  public async pipeFrom(prediction: OngoingPrediction): Promise<PredictionResult> {
    this.handle.abortSignal.addEventListener("abort", () => {
      prediction.cancel();
    });
    for await (const text of prediction) {
      this.appendText(text);
    }
    const result = await prediction;
    this.attachGenInfo({
      indexedModelIdentifier: result.modelInfo.path,
      identifier: result.modelInfo.identifier,
      loadModelConfig: result.loadConfig,
      predictionConfig: result.predictionConfig,
      stats: result.stats,
    });
    return result;
  }
}
