import { z } from "zod";
import { jsonSerializableSchema } from "../JSONSerializable";

/**
 * TODO: Documentation
 *
 * @public
 */
export type LLMToolUseSetting =
  | {
      type: "none";
    }
  | {
      type: "json";
      jsonSchema?: any;
    };

export const llmToolUseSettingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("none"),
  }),
  z.object({
    type: z.literal("json"),
    jsonSchema: jsonSerializableSchema.optional(),
  }),
]);
