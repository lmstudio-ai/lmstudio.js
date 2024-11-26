import { flattenSignalOfWritableSignal } from "./flattenSignal.js";
import { Signal } from "./Signal.js";

describe("flattenSignalOfWritableSignal", () => {
  it("should work when outer signal is not changing", async () => {
    const innerWritableSignal = Signal.create(0);
    const outerSignal = Signal.createReadonly(innerWritableSignal);
    const [flattened, setFlattened] = flattenSignalOfWritableSignal(outerSignal);

    expect(await flattened.pull()).toBe(0);

    setFlattened(1);

    expect(await flattened.pull()).toBe(1);

    const callback = jest.fn();
    flattened.subscribe(callback);

    setFlattened(2);

    expect(callback).toHaveBeenCalledWith(2);

    const callbackFull = jest.fn();
    flattened.subscribeFull(callbackFull);

    setFlattened(3, ["some-tag"]);

    expect(callbackFull).toHaveBeenCalledWith(
      3,
      [{ op: "replace", path: [], value: 3 }],
      ["some-tag"],
    );

    innerWritableSignal[1](4);

    expect(await flattened.pull()).toBe(4);
    expect(callback).toHaveBeenCalledWith(4);
    expect(callbackFull).toHaveBeenCalledWith(4, [{ op: "replace", path: [], value: 4 }], []);
  });

  it("should work when outer signal is not changing and setter is called before init", async () => {
    const innerWritableSignal = Signal.create(0);
    const outerSignal = Signal.createReadonly(innerWritableSignal);
    const [flattened, setFlattened] = flattenSignalOfWritableSignal(outerSignal);

    setFlattened(1);

    expect(await flattened.pull()).toBe(1);
  });

  it("should be able to unsubscribe", async () => {
    const innerWritableSignal = Signal.create(0);
    const outerSignal = Signal.createReadonly(innerWritableSignal);
    const [flattened, setFlattened] = flattenSignalOfWritableSignal(outerSignal);

    const callback = jest.fn();
    const unsubscribe = flattened.subscribe(callback);

    setFlattened(1);

    expect(callback).toHaveBeenCalledWith(1);

    unsubscribe();

    setFlattened(2);

    expect(callback).toHaveBeenCalledTimes(1);

    // isStale will only be true after some microtasks. This is not ideal, but a limitation of
    // LazySignal.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(flattened.isStale()).toBe(true);
  });

  it("should work when outer signal is changing", async () => {
    const innerWritableSignal1 = Signal.create(0);
    const innerWritableSignal2 = Signal.create(1);
    const [outerSignal, setOuter] = Signal.create(innerWritableSignal1);
    const [flattened, setFlattened] = flattenSignalOfWritableSignal(outerSignal);

    expect(await flattened.pull()).toBe(0);

    setOuter(innerWritableSignal2);

    expect(await flattened.pull()).toBe(1);

    setFlattened(2);

    expect(await flattened.pull()).toBe(2);
    expect(innerWritableSignal1[0].get()).toBe(0);
    expect(innerWritableSignal2[0].get()).toBe(2);

    const callback = jest.fn();
    flattened.subscribe(callback);
    const callbackFull = jest.fn();
    flattened.subscribeFull(callbackFull);
    setOuter(innerWritableSignal1);

    expect(callback).toHaveBeenCalledWith(0);
    expect(callbackFull).toHaveBeenCalledWith(0, [{ op: "replace", path: [], value: 0 }], []);

    innerWritableSignal1[1](3);

    expect(await flattened.pull()).toBe(3);
    expect(callback).toHaveBeenCalledWith(3);
    expect(callbackFull).toHaveBeenCalledWith(3, [{ op: "replace", path: [], value: 3 }], []);
  });
});
