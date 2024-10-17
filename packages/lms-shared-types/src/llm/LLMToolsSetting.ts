import { z } from "zod";
import { jsonSerializableSchema } from "../JSONSerializable";

/**
 * TODO: Documentation
 *
 * @public
 */
export type LLMToolsSetting =
  | {
      type: "none";
    }
  | {
      type: "json";
      jsonSchema?: any;
    };

export const llmStructuredPredictionSettingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("none"),
  }),
  z.object({
    type: z.literal("json"),
    jsonSchema: jsonSerializableSchema.optional(),
  }),
]);
