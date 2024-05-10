import { type Patch } from "immer";
import { LazySignal, type NotAvailable, type StripNotAvailable } from "./LazySignal";
import { type WriteTag } from "./makeSetter";
import { type SignalLike } from "./Signal";

function isSignalLike<TValue>(value: Subscribable<TValue>): value is SignalLike<TValue> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).get === "function" &&
    typeof (value as any).subscribe === "function"
  );
}
/**
 * Base class for objects that can be subscribed to. Provides common utility methods.
 */
export abstract class Subscribable<TData> {
  public abstract subscribe(
    listener: (data: TData, patches?: Array<Patch>, tags?: Array<WriteTag>) => void,
  ): () => void;
  public subscribeOnce(listener: (data: TData) => void): () => void {
    const unsubscribe = this.subscribe(data => {
      unsubscribe();
      listener(data);
    });
    return unsubscribe;
  }

  public derive<TOutput>(
    deriver: (data: TData) => StripNotAvailable<TOutput>,
    outputEqualsPredicate: (a: TOutput, b: TOutput) => boolean = (a, b) => a === b,
  ): typeof this extends { get(): TData }
    ? LazySignal<TOutput>
    : LazySignal<TOutput | NotAvailable> {
    if (isSignalLike(this)) {
      return LazySignal.deriveFrom([this], deriver) as any;
    }
    const thisWithGetter = this as any as { get?(): TData };
    if (thisWithGetter.get !== undefined) {
      return LazySignal.create<TOutput>(
        deriver(thisWithGetter.get()),
        setDownstream => {
          return this.subscribe((data, _patches, tags) => {
            setDownstream(deriver(data), tags);
          });
        },
        outputEqualsPredicate,
      ) as any;
    }
    return LazySignal.createWithoutInitialValue(setDownstream => {
      return this.subscribe((data, _patches, tags) => {
        setDownstream(deriver(data), tags);
      });
    }, outputEqualsPredicate) as any;
  }
}
