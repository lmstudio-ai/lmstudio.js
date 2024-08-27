import { deserialize as superJsonDeserialize, serialize as superJsonSerialize } from "superjson";
import { z, type ZodSchema } from "zod";

/**
 * Type of serialization:
 *
 * Raw: JSON.stringify and JSON.parse
 * Superjson: SuperJSON.serialize and SuperJSON.deserialize
 */
export type SerializationType = "raw" | "superjson";

const serializedOpaqueSymbol = Symbol("SerializedOpaque");

/**
 * Opaque type that represents a serialized value. The representation here is not accurate and is
 * only used to prevent accidental reading/writing of the opaque value.
 */
export type SerializedOpaque<T> = {
  [serializedOpaqueSymbol]: T;
};

/**
 * Serialize a value to another value using the specified serialization type.
 */
export function serialize<TData>(type: SerializationType, value: TData): SerializedOpaque<TData> {
  switch (type) {
    case "raw":
      return value as SerializedOpaque<TData>;
    case "superjson":
      return superJsonSerialize(value) as unknown as SerializedOpaque<TData>;
  }
}

export function deserialize<TData>(type: SerializationType, value: SerializedOpaque<TData>): TData {
  switch (type) {
    case "raw":
      return value as TData;
    case "superjson":
      return superJsonDeserialize(value as unknown as any) as TData;
  }
}

export const serializedOpaqueSchema = z.any() as ZodSchema<SerializedOpaque<any>>;
