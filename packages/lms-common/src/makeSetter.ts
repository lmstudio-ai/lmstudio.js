import { applyPatches, produce, produceWithPatches, type Patch } from "immer";
import { isAvailable, type StripNotAvailable } from "./LazySignal";

/**
 * A write tag is a tag that can be optionally passed to a setter to identify the update.
 */
export type WriteTag = string;

/**
 * Concatenate Writable Tags
 */
function cwt(...allTags: Array<undefined | Array<WriteTag>>): Array<WriteTag> {
  return allTags
    .filter(tags => tags !== undefined)
    .reduce((acc, tags) => (acc as any).concat(tags), []) as any;
}

/**
 * A setter is a function that can be used to update a value. Different flavors of setters are
 * available in properties:
 * - `withProducer`: to update the value using Immer
 * - `withUpdater`: to update the value using a function
 * - `withPatches`: to update the value using a set of patches
 */
export interface Setter<TData> {
  /**
   * Replaces the value entirely with the given value. If you want to update a substructure of the
   * value, use `withProducer`.
   */
  (value: StripNotAvailable<TData>, tags?: Array<WriteTag>): void;
  /**
   * Updates the value using Immer. (Recommended)
   */
  withProducer(producer: (draft: TData) => void, tags?: Array<WriteTag>): void;
  /**
   * Updates the value using a function. Prefer using `withProducer` instead.
   */
  withUpdater(updater: (oldValue: TData) => StripNotAvailable<TData>, tags?: Array<WriteTag>): void;
  /**
   * Updates the value using a function that returns both the new value and the patches to apply.
   */
  withPatchUpdater(
    updater: (
      oldValue: TData,
    ) => readonly [newValue: StripNotAvailable<TData>, patches: Array<Patch>],
    tags?: Array<WriteTag>,
  ): void;
  /**
   * Updates the value using a set of patches.
   */
  withPatches(patches: Array<Patch>, tags?: Array<WriteTag>): void;
  /**
   * Similar to `withPatches`, but also accepts the new value. This is useful when the new value is
   * already known.
   */
  withValueAndPatches(
    newValue: StripNotAvailable<TData>,
    patches: Array<Patch>,
    tags?: Array<WriteTag>,
  ): void;
}

/**
 * Creates a setter function that can be used to update a value.
 */
export function makeSetter<TData>(
  update: (updater: (oldData: TData) => StripNotAvailable<TData>, tags?: Array<WriteTag>) => void,
  prependTagsFn?: () => Array<WriteTag>,
): Setter<TData> {
  const setter = (value: StripNotAvailable<TData>, tags?: Array<WriteTag>) => {
    update(() => value, cwt(prependTagsFn?.(), tags));
  };
  setter.withProducer = (producer: (draft: TData) => void, tags?: Array<WriteTag>) => {
    update(
      oldData => {
        const newData = produce(oldData, producer);
        if (isAvailable(newData)) {
          return newData;
        }
        throw new Error("Cannot update value to NOT_AVAILABLE");
      },
      cwt(prependTagsFn?.(), tags),
    );
  };
  setter.withUpdater = (
    updater: (oldData: TData) => StripNotAvailable<TData>,
    tags?: Array<WriteTag>,
  ) => {
    update(updater, cwt(prependTagsFn?.(), tags));
  };
  setter.withPatchUpdater = (
    updater: (
      oldData: TData,
    ) => readonly [newData: StripNotAvailable<TData>, patches: Array<Patch>],
    tags?: Array<WriteTag>,
  ) => {
    update(
      oldData => {
        const [newData, _patches] = updater(oldData);
        return newData;
      },
      cwt(prependTagsFn?.(), tags),
    );
  };
  setter.withPatches = (patches: Array<Patch>, tags?: Array<WriteTag>) => {
    update(
      oldData => {
        return applyPatches(oldData as any, patches);
      },
      cwt(prependTagsFn?.(), tags),
    );
  };
  setter.withValueAndPatches = (
    newValue: StripNotAvailable<TData>,
    _patches: Array<Patch>,
    tags?: Array<WriteTag>,
  ) => {
    update(() => newValue, cwt(prependTagsFn?.(), tags));
  };
  return setter;
}

function makeRootReplacingPatches<TData>(value: TData): Array<Patch> {
  return [
    {
      op: "replace",
      path: [],
      value,
    },
  ];
}

/**
 * Creates a setter function that can be used to update a value. This setter will also return the
 * patches that were applied to the value.
 */
export function makeSetterWithPatches<TData>(
  update: (
    updater: (
      oldData: TData,
    ) => readonly [newData: StripNotAvailable<TData>, patches: Array<Patch>],
    tags?: Array<WriteTag>,
  ) => void,
  prependTagsFn?: () => Array<WriteTag>,
): Setter<TData> {
  const setter = (value: StripNotAvailable<TData>, tags?: Array<WriteTag>) => {
    update(() => [value, makeRootReplacingPatches(value)], cwt(prependTagsFn?.(), tags));
  };
  setter.withProducer = (producer: (draft: TData) => void, tags?: Array<WriteTag>) => {
    update(
      oldData => {
        const [newData, patches] = produceWithPatches(oldData, producer);
        if (isAvailable(newData)) {
          return [newData, patches];
        }
        throw new Error("Cannot update value to NOT_AVAILABLE");
      },
      cwt(prependTagsFn?.(), tags),
    );
  };
  setter.withUpdater = (
    updater: (oldData: TData) => StripNotAvailable<TData>,
    tags?: Array<WriteTag>,
  ) => {
    update(
      oldData => {
        const newData = updater(oldData);
        return [newData, makeRootReplacingPatches(newData)];
      },
      cwt(prependTagsFn?.(), tags),
    );
  };
  setter.withPatchUpdater = (
    updater: (
      oldData: TData,
    ) => readonly [newData: StripNotAvailable<TData>, patches: Array<Patch>],
    tags?: Array<WriteTag>,
  ) => {
    update(updater, cwt(prependTagsFn?.(), tags));
  };
  setter.withPatches = (patches: Array<Patch>, tags?: Array<WriteTag>) => {
    update(
      oldData => {
        return [applyPatches(oldData as any, patches), patches];
      },
      cwt(prependTagsFn?.(), tags),
    );
  };
  setter.withValueAndPatches = (
    newValue: StripNotAvailable<TData>,
    patches: Array<Patch>,
    tags?: Array<WriteTag>,
  ) => {
    update(() => [newValue, patches], cwt(prependTagsFn?.(), tags));
  };
  return setter;
}
