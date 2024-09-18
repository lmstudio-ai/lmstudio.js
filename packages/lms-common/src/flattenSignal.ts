import { isAvailable, LazySignal, type NotAvailable } from "./LazySignal";
import { type SignalLike } from "./Signal";

export function flattenSignalOfSignal<TInner>(
  rootSignal: SignalLike<SignalLike<TInner | NotAvailable> | NotAvailable>,
): LazySignal<TInner | NotAvailable> {
  return LazySignal.createWithoutInitialValue<TInner>(setDownstream => {
    let unsubscribeInnerSignal: (() => void) | null = null;
    const subscribeToInnerSignal = (
      maybeInnerSignal: SignalLike<TInner | NotAvailable> | NotAvailable,
    ) => {
      if (!isAvailable(maybeInnerSignal)) {
        return () => {};
      }
      if (unsubscribeInnerSignal !== null) {
        unsubscribeInnerSignal();
        unsubscribeInnerSignal = null;
      }
      const maybeUpdateDownstream = (value: TInner | NotAvailable) => {
        if (!isAvailable(value)) {
          return;
        }
        setDownstream(value);
      };
      unsubscribeInnerSignal = maybeInnerSignal.subscribe(maybeUpdateDownstream);
      maybeUpdateDownstream(maybeInnerSignal.get());
    };
    const unsubscribeRootSignal = rootSignal.subscribe(subscribeToInnerSignal);
    subscribeToInnerSignal(rootSignal.get());
    return () => {
      if (unsubscribeInnerSignal !== null) {
        unsubscribeInnerSignal();
      }
      unsubscribeRootSignal();
    };
  });
}
