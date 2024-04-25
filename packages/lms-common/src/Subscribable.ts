import { LazySignal, type NotAvailable } from "./LazySignal";

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
  ): typeof this extends { get(): TData }
    ? LazySignal<TOutput>
    : LazySignal<TOutput | NotAvailable> {
    const thisWithGetter = this as any as { get?(): TData };
    if (thisWithGetter.get !== undefined) {
      return LazySignal.create(
        deriver(thisWithGetter.get()),
        listener => {
          return this.subscribe(data => {
            listener(deriver(data));
          });
        },
        outputEqualsPredicate,
      ) as any;
    }
    return LazySignal.createWithoutInitialValue(listener => {
      return this.subscribe(data => {
        listener(deriver(data));
      });
    }, outputEqualsPredicate) as any;
  }
}
