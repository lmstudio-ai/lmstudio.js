import { BufferedEvent } from "./BufferedEvent.js";

export class TimeoutTracker {
  public constructor(private readonly timeoutMs: number) {
    [this.triggeredEvent, this.emitTriggeredEvent] = BufferedEvent.create<void>();
  }

  public readonly triggeredEvent: BufferedEvent<void>;
  private emitTriggeredEvent: () => void;

  public started = false;
  private timeout: NodeJS.Timeout | null = null;
  public reset() {
    if (!this.started) {
      return;
    }
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.emitTriggeredEvent();
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
      }
    }, this.timeoutMs);
  }
  public start() {
    this.started = true;
    this.reset();
  }
  public stop() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.started = false;
  }
}
