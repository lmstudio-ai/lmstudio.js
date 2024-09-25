import { text } from "./text";

export abstract class MaybeMutable<Data> {
  protected constructor(
    protected readonly data: Data,
    protected readonly mutable: boolean,
  ) {}

  /**
   * Gets the underlying data without any access control. Only used internally.
   *
   * @internal
   */
  public _internalGetData(): Data {
    return this.data;
  }

  /**
   * If this instance is mutable, return as is.
   *
   * If this instance is immutable, return a mutable copy.
   *
   * Very easy to misuse, thus internal only for now.
   *
   * @internal
   */
  public _internalToMutable(): this {
    if (this.mutable) {
      return this;
    }
    return this.asMutableCopy();
  }

  /**
   * Gets the class name. This is used for printing errors.
   */
  protected abstract getClassName(): string;
  /**
   * Creates a new instance of the class with the given data.
   */
  protected abstract create(data: Data, mutable: boolean): this;
  /**
   * Clones the data.
   */
  protected abstract cloneData(data: Data): Data;

  public asMutableCopy(): this {
    return this.create(this.cloneData(this.data), true);
  }

  public asImmutableCopy(): this {
    if (this.mutable) {
      return this.create(this.cloneData(this.data), false);
    }
    return this;
  }

  protected guardMutable(): void {
    if (!this.mutable) {
      throw new Error(text`
        Cannot modify immutable ${this.getClassName()} instance. Use asMutableCopy() to get a
        mutable copy.
      `);
    }
  }
}

export interface MaybeMutableInternal<Data> extends MaybeMutable<Data> {
  _internalGetData(): Data;
  _internalToMutable(): this;
}

export function accessMaybeMutableInternals<TData>(maybeMutable: MaybeMutable<TData>) {
  return maybeMutable as MaybeMutableInternal<TData>;
}
