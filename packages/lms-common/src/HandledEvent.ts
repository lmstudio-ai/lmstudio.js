import { Subscribable } from "./Subscribable";

/**
 * Emit events immediately and returns a promise when all handlers are done.
 *
 * May cause problems if listeners are added or removed during the event.
 */
export class HandledEvent<TData> extends Subscribable<TData> {
  public static create<TData>(): readonly [
    event: HandledEvent<TData>,
    emit: (data: TData) => Promise<void>,
  ] {
    const event = new HandledEvent<TData>();
    return [event, event.emit.bind(event)];
  }
  public listeners: Set<(data: TData) => void> = new Set();
  public override subscribe(listener: (data: TData) => void | Promise<void>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private async emit(data: TData): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const listener of this.listeners) {
      promises.push(Promise.resolve(listener(data)));
    }
    await Promise.all(promises);
  }
}
