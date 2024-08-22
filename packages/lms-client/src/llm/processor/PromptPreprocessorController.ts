import {
  type CitationSource,
  type ProcessorInputContext,
  type ProcessorInputMessage,
  type PromptPreprocessorUpdate,
  type StatusStepState,
} from "@lmstudio/lms-shared-types";

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

/**
 * @public
 */
export interface PredictionStepController {}

function createId() {
  return `${Date.now()}-${Math.random()}`;
}

export interface PromptCoPreprocessor {
  handleUpdate: (update: PromptPreprocessorUpdate) => void;
  // getLLM: (opts: GetModelOpts) => Promise<LLMDynamicHandle>;
}

const sendUpdate = Symbol("sendUpdate");

/**
 * Controller for a prompt preprocessing session. Controller can be used to show status, debug info,
 * and/or citation blocks to the user in LM Studio.
 *
 * @public
 */
export class PromptPreprocessController {
  private endedFlag: boolean = false;
  private stepControllers: Array<PredictionStepController> = [];

  /** @internal */
  public constructor(
    /** @internal */
    private readonly coprocessor: PromptCoPreprocessor,
    /** @internal */
    private readonly context: ProcessorInputContext,
    /** @internal */
    private readonly userMessage: ProcessorInputMessage,
    public readonly abortSignal: AbortSignal,
  ) {}

  /**
   * Send an update to LM Studio.
   *
   * @internal
   */
  public [sendUpdate](update: PromptPreprocessorUpdate) {
    if (this.hasEnded()) {
      throw new Error("Prediction process has ended.");
    }
    this.coprocessor.handleUpdate(update);
  }

  /**
   * Get the previous context. Does not include the current user message.
   */
  public getContext() {
    return this.context;
  }

  /**
   * Get the current user message. i.e. the message that this preprocessor needs to process.
   */
  public getUserMessage() {
    return this.userMessage;
  }

  /**
   * Whether the prediction process has ended.
   *
   * @internal
   */
  public hasEnded(): boolean {
    return this.endedFlag;
  }

  /**
   * Ends the prediction process. Used internally.
   *
   * @internal
   */
  public end() {
    this.endedFlag = true;
  }

  public createStatus(initialState: StatusStepState): PredictionProcessStatusController {
    const id = createId();
    this[sendUpdate]({
      type: "status.create",
      id,
      state: initialState,
    });
    const statusController = new PredictionProcessStatusController(this, initialState, id);
    this.stepControllers.push(statusController);
    return statusController;
  }

  public createCitationBlock(
    citedText: string,
    source: CitationSource,
  ): PredictionProcessCitationBlockController {
    const id = createId();
    this[sendUpdate]({
      type: "citationBlock.create",
      id,
      citedText,
      source,
    });
    const citationBlockController = new PredictionProcessCitationBlockController(this, id);
    this.stepControllers.push(citationBlockController);
    return citationBlockController;
  }

  /**
   * @internal
   */
  public createDebugInfoBlock(debugInfo: string): PredictionProcessDebugInfoBlockController {
    const id = createId();
    this[sendUpdate]({
      type: "debugInfoBlock.create",
      id,
      debugInfo,
    });
    const debugInfoBlockController = new PredictionProcessDebugInfoBlockController(this, id);
    this.stepControllers.push(debugInfoBlockController);
    return debugInfoBlockController;
  }

  public debug(...messages: Array<any>) {
    this.createDebugInfoBlock(concatenateDebugMessages(...messages));
  }

  /**
   * Throws an error if the prediction process has been aborted. Sprinkle this throughout your code
   * to ensure that the prediction process is aborted as soon as possible.
   */
  public abortGuard() {
    if (this.abortSignal.aborted) {
      throw this.abortSignal.reason;
    }
  }
}

/**
 * Controller for a status block in the prediction process.
 *
 * @public
 */
export class PredictionProcessStatusController implements PredictionStepController {
  public constructor(
    private readonly controller: PromptPreprocessController,
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
    this.controller[sendUpdate]({
      type: "status.update",
      id: this.id,
      state: this.lastState,
    });
  }
  public setState(state: StatusStepState) {
    this.lastState = state;
    this.controller[sendUpdate]({
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
    this.controller[sendUpdate]({
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
      this.controller,
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
export class PredictionProcessCitationBlockController implements PredictionStepController {
  public constructor(
    private readonly controller: PromptPreprocessController,
    private readonly id: string,
  ) {}
}

/**
 * Controller for a debug info block in the prediction process. Currently cannot do anything.
 *
 * @public
 */
export class PredictionProcessDebugInfoBlockController implements PredictionStepController {
  public constructor(
    private readonly controller: PromptPreprocessController,
    private readonly id: string,
  ) {}
}
