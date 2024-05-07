import "."; // Import order
import { Signal } from "./Signal";

describe("Signal", () => {
  test("contain the value properly", () => {
    const [signal, setSignal] = Signal.create(0);
    expect(signal.get()).toBe(0);
    setSignal(1);
    expect(signal.get()).toBe(1);
  });

  test("notify the subscribers", () => {
    const [signal, setSignal] = Signal.create(0);
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();
    signal.subscribe(subscriber1);
    signal.subscribe(subscriber2);
    expect(subscriber1).not.toHaveBeenCalled();
    expect(subscriber2).not.toHaveBeenCalled();
    setSignal(1);
    expect(subscriber1).toHaveBeenCalledTimes(1);
    expect(subscriber1).toHaveBeenCalledWith(1, [{ op: "replace", path: [], value: 1 }], []);
    expect(subscriber2).toHaveBeenCalledTimes(1);
    expect(subscriber2).toHaveBeenCalledWith(1, [{ op: "replace", path: [], value: 1 }], []);
  });

  test("removing a subscriber", () => {
    const [signal, setSignal] = Signal.create(0);
    const subscriber = jest.fn();
    const unsubscribe = signal.subscribe(subscriber);
    unsubscribe();
    setSignal(1);
    expect(subscriber).not.toHaveBeenCalled();
  });

  test("no change will not notify the subscribers", () => {
    const [signal, setSignal] = Signal.create(0);
    const subscriber = jest.fn();
    signal.subscribe(subscriber);
    setSignal(0);
    expect(subscriber).not.toHaveBeenCalled();
  });

  test("use === to compare the values", () => {
    const [signal, setSignal] = Signal.create([]);
    const subscriber = jest.fn();
    signal.subscribe(subscriber);
    setSignal([]);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("use the custom equals predicate", () => {
    const compareFn = jest.fn(() => true);
    const [signal, setSignal] = Signal.create(0, compareFn);
    const subscriber = jest.fn();
    signal.subscribe(subscriber);
    setSignal(1);
    expect(compareFn).toHaveBeenCalledTimes(1);
    expect(compareFn).toHaveBeenCalledWith(0, 1);
    expect(subscriber).toHaveBeenCalledTimes(0);
  });

  test("callback adds new subscriber", () => {
    const [signal, setSignal] = Signal.create(0);
    const lateSubscriber = jest.fn();
    signal.subscribe(() => {
      signal.subscribe(lateSubscriber);
    });
    setSignal(1);
    expect(lateSubscriber).toHaveBeenCalledTimes(1);
  });

  test("callback removes subscriber", () => {
    const [signal, setSignal] = Signal.create(0);
    const lateSubscriber = jest.fn();
    // eslint-disable-next-line prefer-const
    let unsubscribe: () => void;
    signal.subscribe(() => {
      unsubscribe();
    });
    unsubscribe = signal.subscribe(lateSubscriber);
    setSignal(1);
    expect(lateSubscriber).toHaveBeenCalledTimes(0);
  });

  test("callback update value once, the update should be queued", () => {
    const [signal, setSignal] = Signal.create(0);
    const unsubscribe = signal.subscribe(_value => {
      setSignal(2);
      unsubscribe();
    });
    const subscriber = jest.fn();
    signal.subscribe(subscriber);

    setSignal(1);
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber.mock.calls[0]).toEqual([1, [{ op: "replace", path: [], value: 1 }], []]);
    expect(subscriber.mock.calls[1]).toEqual([2, [{ op: "replace", path: [], value: 2 }], []]);
  });

  test("callback update value twice, the middle update should be ignored", () => {
    const [signal, setSignal] = Signal.create(0);
    const unsubscribe = signal.subscribe(_value => {
      setSignal(2);
      setSignal(3);
      unsubscribe();
    });
    const subscriber = jest.fn();
    signal.subscribe(subscriber);

    setSignal(1);
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber.mock.calls[0]).toEqual([1, [{ op: "replace", path: [], value: 1 }], []]);
    expect(subscriber.mock.calls[1]).toEqual([3, [{ op: "replace", path: [], value: 3 }], []]);
  });

  test("increment three times in subscribe, should bump value to 4", () => {
    const [signal, setSignal] = Signal.create(0);
    const unsubscribe = signal.subscribe(value => {
      if (value === 1) {
        unsubscribe();
      }
      setSignal.withUpdater(value => value + 1);
      setSignal.withUpdater(value => value + 1);
      setSignal.withUpdater(value => value + 1);
    });
    const subscriber = jest.fn();
    signal.subscribe(subscriber);

    setSignal(1);
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber.mock.calls[0]).toEqual([1, [{ op: "replace", path: [], value: 1 }], []]);
    expect(subscriber.mock.calls[1]).toEqual([4, [{ op: "replace", path: [], value: 4 }], []]);
  });

  test("should preserve tags", () => {
    const [signal, setSignal] = Signal.create(0);
    const subscriber = jest.fn();
    signal.subscribe(subscriber);
    setSignal(1, ["tag1", "tag2"]);
    expect(subscriber).toHaveBeenCalledWith(
      1,
      [{ op: "replace", path: [], value: 1 }],
      ["tag1", "tag2"],
    );
  });

  test("should notify if there are write tags even if value is the same", () => {
    const [signal, setSignal] = Signal.create(0);
    const subscriber = jest.fn();
    signal.subscribe(subscriber);
    setSignal(0, ["tag1"]);
    expect(subscriber).toHaveBeenCalledWith(0, [{ op: "replace", path: [], value: 0 }], ["tag1"]);
  });
});
