import { enablePatches, type Patch } from "immer";
import { makeSetter, makeSetterWithPatches } from "./makeSetter";

enablePatches();

interface Counter {
  count: number;
}

describe("makeSetter", () => {
  it("updates value directly", () => {
    let value = { count: 0 };
    const update = jest.fn(updater => {
      value = updater(value);
    });
    const setter = makeSetter<Counter>(update);

    setter({ count: 1 });
    expect(value).toEqual({ count: 1 });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("updates value with withProducer", () => {
    let value = { count: 0 };
    const update = jest.fn(updater => {
      value = updater(value);
    });
    const setter = makeSetter<Counter>(update);

    setter.withProducer(draft => {
      draft.count += 1;
    });
    expect(value).toEqual({ count: 1 });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("updates value with withUpdater", () => {
    let value = { count: 0 };
    const update = jest.fn(updater => {
      value = updater(value);
    });
    const setter = makeSetter<Counter>(update);

    setter.withUpdater(oldValue => ({ ...oldValue, count: oldValue.count + 1 }));
    expect(value).toEqual({ count: 1 });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("applies patches with withPatches", () => {
    let value = { count: 0 };
    const update = jest.fn(updater => {
      value = updater(value);
    });
    const setter = makeSetter<Counter>(update);

    const patches: Patch[] = [{ op: "replace", path: ["count"], value: 1 }];
    setter.withPatches(patches);
    expect(value).toEqual({ count: 1 });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("handles empty patches array with withPatches", () => {
    let value = { count: 0 };
    const update = jest.fn(updater => {
      value = updater(value);
    });
    const setter = makeSetter<Counter>(update);

    setter.withPatches([]);
    // Expect no change since no patches were applied
    expect(value).toEqual({ count: 0 });
    expect(update).toHaveBeenCalledTimes(1);
  });
});

describe("makeSetterWithPatches", () => {
  it("updates value and returns patches", () => {
    let value = { count: 0 };
    let patches: Patch[] | null = null;
    const update = jest.fn(updater => {
      const result = updater(value);
      value = result[0];
      patches = result[1];
    });
    const setter = makeSetterWithPatches<Counter>(update);

    setter({ count: 1 });
    expect(value).toEqual({ count: 1 });
    expect(patches).toEqual([{ op: "replace", path: [], value: { count: 1 } }]);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("updates value with withProducer and returns patches", () => {
    let value = { count: 0 };
    let patchesResult: Patch[] | null = null;
    const update = jest.fn(updater => {
      const result = updater(value);
      value = result[0];
      patchesResult = result[1];
    });
    const setter = makeSetterWithPatches<Counter>(update);

    setter.withProducer(draft => {
      draft.count += 1;
    });
    expect(value).toEqual({ count: 1 });
    // Checks if patches array is not empty and includes an operation that increments count
    expect(patchesResult).toEqual(
      expect.arrayContaining([{ op: "replace", path: ["count"], value: 1 }]),
    );
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("updates value with withUpdater and returns patches", () => {
    let value = { count: 0 };
    let patchesResult: Patch[] | null = null;
    const update = jest.fn(updater => {
      const result = updater(value);
      value = result[0];
      patchesResult = result[1];
    });
    const setter = makeSetterWithPatches<Counter>(update);

    setter.withUpdater(oldValue => ({ ...oldValue, count: oldValue.count + 1 }));
    expect(value).toEqual({ count: 1 });
    // Checks if patches array correctly represents the update
    expect(patchesResult).toEqual([{ op: "replace", path: [], value: { count: 1 } }]);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("applies patches with withPatches and returns the same patches", () => {
    let value = { count: 0 };
    let patchesResult: Patch[] | null = null;
    const update = jest.fn(updater => {
      const result = updater(value);
      value = result[0];
      patchesResult = result[1];
    });
    const setter = makeSetterWithPatches<Counter>(update);

    const patches: Patch[] = [{ op: "replace", path: ["count"], value: 1 }];
    setter.withPatches(patches);
    expect(value).toEqual({ count: 1 });
    // Expect the returned patches to be the same as those applied
    expect(patchesResult).toEqual(patches);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("handles empty patches array with withPatches and returns empty patches array", () => {
    let value = { count: 0 };
    let patchesResult: Patch[] | null = null;
    const update = jest.fn(updater => {
      const result = updater(value);
      value = result[0];
      patchesResult = result[1];
    });
    const setter = makeSetterWithPatches<Counter>(update);

    setter.withPatches([]);
    // Expect no change since no patches were applied
    expect(value).toEqual({ count: 0 });
    // Expect patchesResult to be an empty array indicating no changes
    expect(patchesResult).toEqual([]);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
