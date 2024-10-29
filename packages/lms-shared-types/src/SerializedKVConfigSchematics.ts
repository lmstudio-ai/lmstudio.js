import { z } from "zod";
import { jsonSerializableSchema } from "./JSONSerializable";

export interface SerializedKVConfigSchematicsField {
  key: string;
  typeKey: string;
  typeParams: any;
  defaultValue: any;
}
export const serializedKVConfigSchematicsFieldSchema = z.object({
  key: z.string(),
  typeKey: z.string(),
  typeParams: jsonSerializableSchema,
  defaultValue: jsonSerializableSchema,
}) as z.ZodSchema<SerializedKVConfigSchematicsField>;

export interface SerializedKVConfigSchematics {
  baseKey: string;
  fields: Array<SerializedKVConfigSchematicsField>;
}
export const serializedKVConfigSchematicsSchema = z.object({
  baseKey: z.string(),
  fields: z.array(serializedKVConfigSchematicsFieldSchema),
}) as z.ZodSchema<SerializedKVConfigSchematics>;