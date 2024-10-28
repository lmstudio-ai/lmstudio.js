import { applyPatches, type Patch } from "immer";
import { isAvailable, LazySignal, type NotAvailable, type StripNotAvailable } from "./LazySignal";
import { makeSetterWithPatches, type Setter } from "./makeSetter";
import { type SignalLike } from "./Signal";

/**
 * A sliced signal is a writable signal that represents a portion of another writable signal.
 */
export function makeSlicedSignalFrom<TSource>(
  writableSignal: readonly [signal: SignalLike<TSource>, setter: Setter<TSource>],
) {
  return new SlicedSignalBuilderImpl<
    TSource,
    StripNotAvailable<TSource>,
    TSource extends NotAvailable ? true : false
  >(writableSignal[0], writableSignal[1]);
}

function drill(value: any, path: Array<string | number>) {
  let current = value;
  for (const key of path) {
    current = current[key];
  }
  return current;
}

export type PathRelationship = "ancestor" | "children" | "neither";

/**
 * Determine the relationship of a to b.
 *
 * - Returns "ancestor" if a is an ancestor of b.
 * - Returns "children" if
 *   - a is a child of b, or
 *   - a is the same as b.
 * - Returns "neither" if a and b are not direct ancestors or children of each other.
 */
export function pathRelationship(a: Array<string | number>, b: Array<string | number>) {
  if (a.length < b.length) {
    if (pathStartsWith(b, a)) {
      return "ancestor";
    } else {
      return "neither";
    }
  } else {
    if (pathStartsWith(a, b)) {
      return "children";
    } else {
      return "neither";
    }
  }
}

function pathStartsWith(path: Array<string | number>, prefix: Array<string | number>) {
  if (path.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (path[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

class SlicedSignalBuilderImpl<TSource, TCurrent, TCanBeNotAvailable extends boolean> {
  private readonly path: Array<string | number> = [];
  private readonly tagKey = String(Math.random());
  public constructor(
    private readonly sourceSignal: SignalLike<TSource>,
    private readonly sourceSetter: Setter<TSource>,
  ) {}
  public access<TKey extends keyof TCurrent>(
    key: TKey,
  ): SlicedSignalBuilderImpl<TSource, TCurrent[TKey], TCanBeNotAvailable> {
    this.path.push(key as number | string);
    return this as any;
  }
  public done(): readonly [
    signal: LazySignal<TCurrent | (TCanBeNotAvailable extends true ? NotAvailable : never)>,
    setter: Setter<TCurrent>,
  ] {
    const sourceInitialValue = this.sourceSignal.get();
    const initialValue = isAvailable(sourceInitialValue)
      ? drill(sourceInitialValue, this.path)
      : LazySignal.NOT_AVAILABLE;
    const signal = LazySignal.create<
      TCurrent | (TCanBeNotAvailable extends true ? NotAvailable : never)
    >(initialValue, setDownstream => {
      const unsubscribe = this.sourceSignal.subscribeFull((value, patches, tags) => {
        const newPatches: Array<Patch> = [];
        // Transform patches
        for (const patch of patches) {
          const relationship = pathRelationship(patch.path, this.path);
          // If one of the ancestors have been replaced, we need to replace the whole value
          if (relationship === "ancestor") {
            if (patch.op !== "replace") {
              throw new Error("Only replace patches are supported for ancestor relationships");
            }
            newPatches.length = 0;
            newPatches.push({
              op: "replace",
              path: [],
              value: drill(
                patch.value!,
                // Get the part that is relevant to this slice
                this.path.slice(patch.path.length),
              ),
            });
          } else if (relationship === "children") {
            // If one of the children have been replaced, we need to replace the subset that
            // corresponds to the change
            newPatches.push({
              ...patch,
              path: patch.path.slice(this.path.length),
            });
          }
          // Otherwise, we don't need to do anything
        }
        const newValue = drill(value, this.path);
        const newTags = tags
          .filter(tag => tag.startsWith(this.tagKey))
          .map(tag => tag.slice(this.tagKey.length));
        if (newPatches.length > 0 || newTags.length > 0) {
          setDownstream.withValueAndPatches(newValue, newPatches, newTags);
        }
      });
      const value = this.sourceSignal.pull();
      if (value instanceof Promise) {
        value.then(value => {
          setDownstream(drill(value, this.path));
        });
      } else {
        setDownstream(drill(value, this.path));
      }

      return unsubscribe;
    });
    const setter = makeSetterWithPatches<TCurrent>((updater, tags) => {
      const newTags = tags?.map(tag => this.tagKey + tag);
      this.sourceSetter.withPatchUpdater(oldValue => {
        const slicedOldValue = drill(oldValue, this.path);
        const [_newSlicedValue, patches] = updater(slicedOldValue);
        const newPatches = patches.map(patch => ({
          ...patch,
          path: [...this.path, ...patch.path],
        }));
        const newValue = applyPatches(oldValue as any, newPatches);
        return [newValue, newPatches] as const;
      }, newTags);
    });
    return [signal, setter];
  }
}

export type SlicedSignalBuilder<
  TSource,
  TCurrent,
  TCanBeNotAvailable extends boolean,
> = SlicedSignalBuilderImpl<TSource, TCurrent, TCanBeNotAvailable>;
