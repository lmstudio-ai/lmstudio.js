import { Subscribable } from "./Subscribable";

type Listener<TData> = (data: TData) => void;

/**
 * Represents an event that can be subscribed to. Emitted events will trigger all subscribers in the
 * next microtask. If multiple events are emitted, they will be triggered in the same microtask.
 */
export class Event<TData> extends Subscribable<TData> {
  private subscribers = new Set<Listener<TData>>();
  protected constructor() {
    super();
  }
  protected emit(data: TData) {
    queueMicrotask(() => {
      for (const subscriber of this.subscribers) {
        subscriber(data);
      }
    });
  }
  public static create<TData>() {
    const event = new Event<TData>();
    const emitter: (data: TData) => void = data => {
      event.emit(data);
    };
    return [event, emitter] as const;
  }
  public subscribe(listener: Listener<TData>) {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }
}
