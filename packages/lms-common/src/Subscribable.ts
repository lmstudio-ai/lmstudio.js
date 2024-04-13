import { LazySignal } from "./LazySignal";

/**
 * Base class for objects that can be subscribed to. Provides common utility methods.
 */
export abstract class Subscribable<TData> {
  public abstract subscribe(listener: (data: TData) => void): () => void;
  public subscribeOnce(listener: (data: TData) => void): () => void {
    const unsubscribe = this.subscribe(data => {
      unsubscribe();
      listener(data);
    });
    return unsubscribe;
  }

  public deriveLazySignal<TOutput>(
    deriver: (data: TData) => TOutput,
    outputEqualsPredicate: (a: TOutput, b: TOutput) => boolean = (a, b) => a === b,
  ): LazySignal<TOutput> {
    return new LazySignal(listener => {
      const unsubscribe = this.subscribe(data => {
        listener(deriver(data));
      });
      return unsubscribe;
    }, outputEqualsPredicate);
  }
}
