import { type Patch } from "immer";
import { isAvailable, LazySignal, type NotAvailable, type StripNotAvailable } from "./LazySignal";
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
    deriver: (data: StripNotAvailable<TData>) => StripNotAvailable<TOutput>,
    outputEqualsPredicate: (a: TOutput, b: TOutput) => boolean = (a, b) => a === b,
  ): typeof this extends { get(): TData }
    ? TOutput extends NotAvailable
      ? LazySignal<TOutput | NotAvailable>
      : LazySignal<TOutput>
    : LazySignal<TOutput | NotAvailable> {
    if (isSignalLike(this)) {
      return LazySignal.deriveFrom([this], deriver) as any;
    }
    const thisWithGetter = this as Subscribable<TData> & { get?(): TData };
    if (thisWithGetter.get !== undefined) {
      const initialValue = thisWithGetter.get();
      if (initialValue === LazySignal.NOT_AVAILABLE) {
        return LazySignal.createWithoutInitialValue(setDownstream => {
          return thisWithGetter.subscribe((data, _patches, tags) => {
            if (isAvailable(data)) {
              setDownstream(deriver(data), tags);
            }
          });
        }) as any;
      }
      const thisNarrowed = thisWithGetter as Subscribable<StripNotAvailable<TData>> & {
        get(): StripNotAvailable<TData>;
      };
      return LazySignal.create<TOutput>(
        deriver(thisNarrowed.get()),
        setDownstream => {
          return thisNarrowed.subscribe((data, _patches, tags) => {
            setDownstream(deriver(data), tags);
          });
        },
        outputEqualsPredicate,
      ) as any;
    }
    return LazySignal.createWithoutInitialValue(setDownstream => {
      return this.subscribe((data, _patches, tags) => {
        if (isAvailable(data)) {
          setDownstream(deriver(data), tags);
        }
      });
    }, outputEqualsPredicate) as any;
  }
}
