import { type OmitStatics } from "./OmitStatics";
import { Signal } from "./Signal";
import { Subscribable } from "./Subscribable";
import { makePromise } from "./makePromise";

type NotAvailable = typeof LazySignal.NOT_AVAILABLE;

/**
 * A lazy signal is a signal that will only subscribe to the upstream when at least one subscriber
 * is attached. It will unsubscribe from the upstream when the last subscriber is removed.
 *
 * The value of the signal will be `LazySignal.NOT_AVAILABLE` until the first value is emitted from
 * the upstream.
 */
export class LazySignal<TData>
  extends Subscribable<TData | NotAvailable>
  implements OmitStatics<Signal<TData | NotAvailable>, "create">
{
  public static readonly NOT_AVAILABLE = Symbol("notAvailable");
  private readonly signal: Signal<TData | NotAvailable>;
  private readonly setValue: (value: TData | NotAvailable) => void;
  private dataIsStale = true;
  private upstreamUnsubscribe: (() => void) | null = null;
  private subscribersCount = 0;

  public constructor(
    private readonly upstreamSubscriber: (listener: (data: TData) => void) => () => void,
    equalsPredicate: (a: TData, b: TData) => boolean = (a, b) => a === b,
  ) {
    super();
    const fullEqualsPredicate = (a: TData | NotAvailable, b: TData | NotAvailable) => {
      if (a === LazySignal.NOT_AVAILABLE || b === LazySignal.NOT_AVAILABLE) {
        return a === b;
      }
      return equalsPredicate(a, b);
    };
    [this.signal, this.setValue] = Signal.create<TData | NotAvailable>(
      LazySignal.NOT_AVAILABLE,
      fullEqualsPredicate,
    );
  }

  /**
   * Returns whether the value is currently stale.
   *
   * A value is stale whenever the upstream subscription is not active. This can happen in two
   * cases:
   *
   * 1. When no subscriber is attached to this signal, the signal will not subscribe to the
   *    upstream. In this case, the value is always stale.
   * 2. When a subscriber is attached, but the upstream has not yet emitted a single value, the
   *    value is also stale.
   *
   * If you wish to get the current value and esnure that it is not stale, use the method
   * {@link LazySignal#pull}.
   */
  public isStale() {
    return this.dataIsStale;
  }

  private subscribeToUpstream() {
    this.upstreamUnsubscribe = this.upstreamSubscriber(data => {
      this.dataIsStale = false;
      this.setValue(data);
    });
  }

  private unsubscribeFromUpstream() {
    if (this.upstreamUnsubscribe !== null) {
      this.upstreamUnsubscribe();
      this.upstreamUnsubscribe = null;
      this.dataIsStale = true;
    }
  }

  /**
   * Gets the current value of the signal. If the value is not available, it will return
   * {@link LazySignal.NOT_AVAILABLE}. In addition, the value returned by this method may be stale.
   * Use {@link LazySignal#isStale} to check if the value is stale.
   *
   * If you wish to get the current value and ensure that it is not stale, use the method
   * {@link LazySignal#pull}.
   */
  public get(): TData | typeof LazySignal.NOT_AVAILABLE {
    return this.signal.get();
  }

  /**
   * Pulls the current value of the signal. If the value is stale, it will wait for the next value
   * from the upstream and return it.
   */
  public async pull(): Promise<TData> {
    const { promise, resolve } = makePromise<TData>();
    if (!this.isStale()) {
      // If not stale, definitely not "NOT_AVAILABLE"
      resolve(this.get() as TData);
    }
    this.subscribeOnce(data => {
      resolve(data as TData);
    });
    return promise;
  }

  public subscribe(callback: (value: TData | typeof LazySignal.NOT_AVAILABLE) => void): () => void {
    if (this.subscribersCount === 0) {
      this.subscribeToUpstream();
    }
    this.subscribersCount++;
    const unsubscribe = this.signal.subscribe(callback);
    let unsubscribeCalled = false;
    return () => {
      if (unsubscribeCalled) {
        return;
      }
      unsubscribe();
      unsubscribeCalled = true;
      this.subscribersCount--;
      if (this.subscribersCount === 0) {
        this.unsubscribeFromUpstream();
      }
    };
  }
}
