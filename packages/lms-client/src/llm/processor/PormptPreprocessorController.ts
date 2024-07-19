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

const ensureEnded = Symbol("ensureEnded");

interface PredictionStepController {
  [ensureEnded](): void;
}

export interface PromptCoPreprocessor {
  handleUpdate: (update: PromptPreprocessorUpdate) => void;
  // getLLM: (opts: GetModelOpts) => Promise<LLMDynamicHandle>;
}

export class PromptPreprocessController {
  private endedFlag: boolean = false;
  private stepControllers: Array<PredictionStepController> = [];
  public constructor(
    private readonly coprocessor: PromptCoPreprocessor,
    private readonly context: ProcessorInputContext,
    private readonly userMessage: ProcessorInputMessage,
    public readonly abortSignal: AbortSignal,
  ) {}
  private createId() {
    return `${Date.now()}-${Math.random()}`;
  }
  public sendUpdate(update: PromptPreprocessorUpdate) {
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
   * Get the current user message.
   */
  public getUserMessage() {
    return this.userMessage;
  }
  public hasEnded(): boolean {
    return this.endedFlag;
  }
  public end() {
    for (const controller of this.stepControllers) {
      controller[ensureEnded]();
    }
    this.endedFlag = true;
  }

  public createStatus(initialState: StatusStepState): PredictionProcessStatusController {
    const id = this.createId();
    this.sendUpdate({
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
    const id = this.createId();
    this.sendUpdate({
      type: "citationBlock.create",
      id,
      citedText,
      source,
    });
    const citationBlockController = new PredictionProcessCitationBlockController(this, id);
    this.stepControllers.push(citationBlockController);
    return citationBlockController;
  }

  public createDebugInfoBlock(debugInfo: string): PredictionProcessDebugInfoBlockController {
    const id = this.createId();
    this.sendUpdate({
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
}
export class PredictionProcessStatusController implements PredictionStepController {
  public constructor(
    private readonly controller: PromptPreprocessController,
    initialState: StatusStepState,
    private readonly id: string,
  ) {
    this.lastState = initialState;
  }
  private lastState: StatusStepState;
  public [ensureEnded]() {
    if (["loading", "waiting"].includes(this.lastState.status)) {
      this.setState({
        status: "canceled",
        text: this.lastState.text,
      });
    }
  }
  public setState(state: StatusStepState) {
    this.lastState = state;
    this.controller.sendUpdate({
      type: "status.update",
      id: this.id,
      state,
    });
  }
}

export class PredictionProcessCitationBlockController implements PredictionStepController {
  public constructor(
    private readonly controller: PromptPreprocessController,
    private readonly id: string,
  ) {}
  public [ensureEnded](): void {
    // No-op
  }
}

export class PredictionProcessDebugInfoBlockController implements PredictionStepController {
  public constructor(
    private readonly controller: PromptPreprocessController,
    private readonly id: string,
  ) {}
  public [ensureEnded](): void {
    // No-op
  }
}
