import { Event } from "./Event";
import { Subscribable } from "./Subscribable";

type Listener<TData> = (data: TData) => void;
const waitForNextMicroTask = Symbol();
/**
 * A buffered event will buffer events in a queue if no subscribers are present. When a subscriber
 * is added, all buffered events will trigger sequentially in the next microtask.
 *
 * Similar to Event, events are always emitted during the next microtask.
 *
 * Attempting to add more than one subscriber will resulting in an error.
 */
export class BufferedEvent<TData> extends Subscribable<TData> {
  private subscriber: Listener<TData> | null = null;
  private queued: Array<TData | typeof waitForNextMicroTask> = [];
  private isNotifying = false;
  public static create<TData>() {
    const event = new BufferedEvent<TData>();
    const emitter: (data: TData) => void = data => {
      event.emit(data);
    };
    return [event, emitter] as const;
  }
  private constructor() {
    super();
  }
  private emit(data: TData) {
    if (this.queued.length === 0 && this.queued.at(-1) !== waitForNextMicroTask) {
      this.queued.push(waitForNextMicroTask);
    }
    this.queued.push(data);
    if (!this.isNotifying) {
      this.notifier();
    }
  }
  private async notifier() {
    this.isNotifying = true;
    while (this.subscriber !== null && this.queued.length > 0) {
      const data = this.queued.shift()!;
      if (data === waitForNextMicroTask) {
        await Promise.resolve();
      } else {
        this.subscriber(data);
      }
    }
    this.isNotifying = false;
  }
  public subscribe(listener: Listener<TData>) {
    if (this.subscriber !== null) {
      throw new Error("Cannot have more than one subscriber");
    }
    this.subscriber = listener;
    if (!this.isNotifying && this.queued.length > 0) {
      this.queued = [
        waitForNextMicroTask,
        ...this.queued.filter(data => data !== waitForNextMicroTask),
      ];
      this.notifier();
    }
    return () => {
      this.subscriber = null;
    };
  }
  /**
   * Convert this buffered event to an event by stop buffering and triggering events on the new
   * returned event.
   */
  public flow(): Event<TData> {
    const [event, emit] = Event.create<TData>();
    this.subscribe(emit);
    return event;
  }
}
