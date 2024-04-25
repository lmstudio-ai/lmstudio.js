import { type OmitStatics } from "./OmitStatics";
import { Signal, type SignalSetter } from "./Signal";
import { Subscribable } from "./Subscribable";
import { makePromise } from "./makePromise";

export type NotAvailable = typeof LazySignal.NOT_AVAILABLE;

/**
 * A lazy signal is a signal that will only subscribe to the upstream when at least one subscriber
 * is attached. It will unsubscribe from the upstream when the last subscriber is removed.
 *
 * A lazy signal can possess a special value "NOT_AVAILABLE", accessible from the static property
 * {@link LazySignal.NOT_AVAILABLE}. This value is used to indicate that the value is not available
 * yet. This can happen when the signal is created without an initial value and the upstream has not
 * emitted a value yet.
 */
export class LazySignal<TData>
  extends Subscribable<TData>
  implements OmitStatics<Signal<TData>, "create">
{
  public static readonly NOT_AVAILABLE = Symbol("notAvailable");
  private readonly signal: Signal<TData>;
  private readonly setValue: SignalSetter<TData>;
  private dataIsStale = true;
  private upstreamUnsubscribe: (() => void) | null = null;
  private subscribersCount = 0;

  public static create<TData>(
    initialValue: TData,
    upstreamSubscriber: (listener: (data: TData) => void) => () => void,
    equalsPredicate: (a: TData, b: TData) => boolean = (a, b) => a === b,
  ) {
    return new LazySignal(initialValue, upstreamSubscriber, equalsPredicate);
  }

  public static createWithoutInitialValue<TData>(
    upstreamSubscriber: (listener: (data: TData) => void) => () => void,
    equalsPredicate: (a: TData, b: TData) => boolean = (a, b) => a === b,
  ): LazySignal<TData | NotAvailable> {
    const fullEqualsPredicate = (a: TData | NotAvailable, b: TData | NotAvailable) => {
      if (a === LazySignal.NOT_AVAILABLE || b === LazySignal.NOT_AVAILABLE) {
        return a === b;
      }
      return equalsPredicate(a, b);
    };
    return new LazySignal<TData | NotAvailable>(
      LazySignal.NOT_AVAILABLE,
      upstreamSubscriber,
      fullEqualsPredicate,
    );
  }

  protected constructor(
    initialValue: TData,
    private readonly upstreamSubscriber: (listener: (data: TData) => void) => () => void,
    equalsPredicate: (a: TData, b: TData) => boolean = (a, b) => a === b,
  ) {
    super();
    [this.signal, this.setValue] = Signal.create<TData>(initialValue, equalsPredicate);
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
  public get(): TData {
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

  public subscribe(callback: (value: TData) => void): () => void {
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
