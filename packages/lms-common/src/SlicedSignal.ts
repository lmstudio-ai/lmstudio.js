import { applyPatches, type Patch } from "@lmstudio/immer-with-plugins";
import {
  isAvailable,
  LazySignal,
  type NotAvailable,
  type StripNotAvailable,
} from "./LazySignal.js";
import { makeSetterWithPatches, type Setter } from "./makeSetter.js";
import { type SignalLike } from "./Signal.js";

type PathSegment =
  | {
      type: "key";
      key: string | number;
    }
  | {
      type: "mapKey";
      key: any;
    }
  | {
      type: "keyWithDefault";
      key: string | number;
      default: any;
    }
  | {
      type: "mapKeyWithDefault";
      key: any;
      default: any;
    };

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

/**
 * Given a value and a path, return the value at the path.
 *
 * At any point, if a default value is used, the defaultUsed callback is called with the index of
 * the path segment where the default value was used.
 */
function drill(value: any, path: Array<PathSegment>, defaultUsed?: (index: number) => void) {
  let current = value;
  let index = 0;
  for (const key of path) {
    if (key.key === "__proto__") {
      throw new Error("Cannot access __proto__");
    }
    switch (key.type) {
      case "key":
        current = current[key.key];
        break;
      case "keyWithDefault": {
        if (current[key.key] === undefined) {
          current = key.default;
          defaultUsed?.(index);
        } else {
          current = current[key.key];
        }
        break;
      }
      case "mapKey":
        current = current.get(key.key);
        break;
      case "mapKeyWithDefault":
        if (!current.has(key.key)) {
          current = key.default;
          defaultUsed?.(index);
        } else {
          current = current.get(key.key);
        }
        break;
      default: {
        const _exhaustiveCheck: never = key;
        return _exhaustiveCheck;
      }
    }
    index++;
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
  private readonly accessPath: Array<PathSegment> = [];
  private readonly path: Array<any> = [];
  private readonly tagKey = String(Math.random());
  public constructor(
    private readonly sourceSignal: SignalLike<TSource>,
    private readonly sourceSetter: Setter<TSource>,
  ) {}
  public access<TKey extends keyof TCurrent & (string | number)>(
    key: TKey,
  ): SlicedSignalBuilderImpl<TSource, TCurrent[TKey], TCanBeNotAvailable> {
    this.accessPath.push({ type: "key", key });
    this.path.push(key);
    return this as any;
  }
  public accessWithDefault<TKey extends keyof TCurrent & (string | number)>(
    key: TKey,
    defaultValue: TCurrent[TKey],
  ): SlicedSignalBuilderImpl<TSource, TCurrent[TKey], TCanBeNotAvailable> {
    this.accessPath.push({ type: "keyWithDefault", key, default: defaultValue });
    this.path.push(key);
    return this as any;
  }
  public mapAccess<TKey extends TCurrent extends Map<infer RKey, any> ? RKey : never>(
    key: TKey,
  ): SlicedSignalBuilderImpl<
    TSource,
    TCurrent extends Map<any, infer RValue> ? RValue : never,
    TCanBeNotAvailable
  > {
    this.accessPath.push({ type: "mapKey", key });
    this.path.push(key);
    return this as any;
  }
  public mapAccessWithDefault<
    TKey extends TCurrent extends Map<infer RKey, infer _RValue> ? RKey : never,
  >(
    key: TKey,
    defaultValue: TCurrent extends Map<TKey, infer RValue> ? RValue : never,
  ): SlicedSignalBuilderImpl<
    TSource,
    TCurrent extends Map<TKey, infer RValue> ? RValue : never,
    TCanBeNotAvailable
  > {
    this.accessPath.push({ type: "mapKeyWithDefault", key, default: defaultValue });
    this.path.push(key);
    return this as any;
  }
  public done(): readonly [
    signal: LazySignal<TCurrent | (TCanBeNotAvailable extends true ? NotAvailable : never)>,
    setter: Setter<TCurrent>,
  ] {
    const sourceInitialValue = this.sourceSignal.get();
    const initialValue = isAvailable(sourceInitialValue)
      ? drill(sourceInitialValue, this.accessPath)
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
                this.accessPath.slice(patch.path.length),
              ),
            });
          } else if (relationship === "children") {
            // If one of the children have been replaced, we need to replace the subset that
            // corresponds to the change
            newPatches.push({
              ...patch,
              path: patch.path.slice(this.accessPath.length),
            });
          }
          // Otherwise, we don't need to do anything
        }
        const newValue = drill(value, this.accessPath);
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
          setDownstream(drill(value, this.accessPath));
        });
      } else {
        setDownstream(drill(value, this.accessPath));
      }

      return unsubscribe;
    });
    const setter = makeSetterWithPatches<TCurrent>((updater, tags) => {
      const newTags = tags?.map(tag => this.tagKey + tag);
      this.sourceSetter.withPatchUpdater(oldValue => {
        const newPatches: Array<Patch> = [];
        const slicedOldValue = drill(oldValue, this.accessPath, index => {
          // A default value has been used. We need to inject a patch that adds the default value
          // to the parent object.
          const defaultPathSegment = this.accessPath[index];
          if (
            defaultPathSegment.type !== "keyWithDefault" &&
            defaultPathSegment.type !== "mapKeyWithDefault"
          ) {
            throw new Error("Expected keyWithDefault or mapKeyWithDefault");
          }
          const defaultValue = defaultPathSegment.default;
          newPatches.push({
            op: "replace",
            path: this.path.slice(0, index + 1),
            value: defaultValue,
          });
        });
        const [_newSlicedValue, patches] = updater(slicedOldValue);
        newPatches.push(
          ...patches.map(patch => ({
            ...patch,
            path: [...this.path, ...patch.path],
          })),
        );
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
