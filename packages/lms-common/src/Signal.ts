import { produceWithPatches, type Patch } from "immer";
import { Subscribable } from "./Subscribable";

export interface SignalSetter<TValue> {
  (value: TValue): void;
  withImmer(producer: (draft: TValue) => void): void;
}

const notQueued = Symbol("notQueued");
const equals = <TValue>(a: TValue, b: TValue) => a === b;

/**
 * A signal is a wrapper for a value. It can be used to notify subscribers when the value changes.
 * For it to work properly, the value should be immutable.
 *
 * To create a signal, please use the `Signal.create` static method. It will return a signal
 * along with a function to update its value.
 */
export class Signal<TValue> extends Subscribable<TValue> {
  /**
   * Creates a signal.
   *
   * @param value - The initial value of the signal.
   * @param equalsPredicate - A function to compare two values. The subscribers will only be called
   * if the value changes according to the `equalsPredicate`. By default, it uses the `===`
   * operator.
   * @returns This method returns a tuple with two elements:
   * - The signal
   * - A function to update the value
   **/
  public static create<TValue>(
    value: TValue,
    equalsPredicate: (a: TValue, b: TValue) => boolean = equals,
  ) {
    const signal = new Signal(value, equalsPredicate);
    const setValue = (value: TValue) => {
      signal.set(value, [
        {
          op: "replace",
          path: [],
          value,
        },
      ]);
    };
    setValue.withImmer = signal.setWithImmer.bind(signal);
    return [signal, setValue] as const;
  }
  protected constructor(
    private value: TValue,
    private equalsPredicate: (a: TValue, b: TValue) => boolean,
  ) {
    super();
  }
  private subscribers: Set<(value: TValue) => void> = new Set();
  /**
   * Returns the current value of the signal.
   */
  public get() {
    return this.value;
  }
  private queuedUpdate: TValue | typeof notQueued = notQueued;
  private queuedPatches: Array<Patch> = [];
  private isEmitting = false;
  private notify(value: TValue) {
    for (const subscriber of this.subscribers) {
      subscriber(value);
    }
  }
  private notifyAndUpdateIfChanged(value: TValue) {
    if (!this.equalsPredicate(this.value, value)) {
      this.value = value;
      this.notify(value);
    }
  }

  private makeReplaceRootPatch(value: TValue): Patch {
    return {
      op: "replace",
      path: [],
      value,
    };
  }

  protected set(value: TValue, patches?: Array<Patch>) {
    if (this.isEmitting) {
      // It is already emitting, so we should queue the update.
      this.queuedUpdate = value;
      if (patches === undefined) {
        this.queuedPatches = [this.makeReplaceRootPatch(value)];
      } else {
        this.queuedPatches.push(...patches);
      }
      return;
    }
    this.isEmitting = true;
    try {
      this.notifyAndUpdateIfChanged(value);
      while (this.queuedUpdate !== notQueued) {
        const queuedValue = this.queuedUpdate;
        this.queuedUpdate = notQueued;
        this.notifyAndUpdateIfChanged(queuedValue);
      }
    } finally {
      this.isEmitting = false;
    }
  }

  protected setWithImmer(producer: (draft: TValue) => void) {
    const [updated, patch] = produceWithPatches(this.value, producer);
    this.set(updated, patch);
  }
  /**
   * Subscribes to the signal. The callback will be called whenever the value changes. All callbacks
   * are called synchronously upon updating. It will NOT be immediately called with the current
   * value. (Use `get()` to get the current value.) Returns a function to unsubscribe.
   *
   * Edge cases involving manipulating the signal in the callback:
   *
   * - If the callback adds new subscribers, they will also be called within the same update.
   * - If the callback causes removal of subscribers that have not been called yet, they will no
   *   longer be called.
   * - If the callback causes an update of the value, the update will be queued. If multiple updates
   *   are queued, only the last one will be executed.
   *
   * Edge cases involving adding the same callback multiple times.
   *
   *  - Callbacks are tracked with a set. Adding the same subscriber will not cause it to be called
   *    multiple times.
   */
  public subscribe(callback: (value: TValue) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}
