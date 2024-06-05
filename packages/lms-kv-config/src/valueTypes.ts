import {
  llmLlamaAccelerationSettingSchema,
  llmStructuredPredictionSettingSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type InferKVValueTypeDef, KVFieldValueTypesLibraryBuilder } from "./KVConfig";

export const kvValueTypesLibrary = new KVFieldValueTypesLibraryBuilder()
  .valueType("numeric", {
    paramType: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      int: z.boolean().optional(),
    }),
    schemaMaker: ({ min, max, int }) => {
      let schema = z.number();
      if (min !== undefined) {
        schema = schema.min(min);
      }
      if (max !== undefined) {
        schema = schema.max(max);
      }
      if (int) {
        schema = schema.int();
      }
      return schema;
    },
  })
  .valueType("string", {
    paramType: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
    }),
    schemaMaker: ({ minLength, maxLength }) => {
      let schema = z.string();
      if (minLength !== undefined) {
        schema = schema.min(minLength);
      }
      if (maxLength !== undefined) {
        schema = schema.max(maxLength);
      }
      return schema;
    },
  })
  .valueType("boolean", {
    paramType: z.void(),
    schemaMaker: () => {
      return z.boolean();
    },
  })
  .valueType("selection", {
    paramType: z.object({
      options: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
        }),
      ),
    }),
    schemaMaker: () => {
      return z.string();
    },
  })
  .valueType("stringArray", {
    paramType: z.object({
      maxNumItems: z.number().optional(),
      /**
       * Whether to allow empty strings in the array. Default is false.
       */
      allowEmptyStrings: z.boolean().optional(),
    }),
    schemaMaker: ({ maxNumItems, allowEmptyStrings }) => {
      let stringSchema = z.string();
      if (!allowEmptyStrings) {
        stringSchema = stringSchema.min(1);
      }
      let schema = z.array(stringSchema);
      if (maxNumItems !== undefined) {
        schema = schema.max(maxNumItems);
      }
      return schema;
    },
  })
  .valueType("llamaStructuredOutput", {
    paramType: z.void(),
    schemaMaker: () => {
      return llmStructuredPredictionSettingSchema;
    },
  })
  .valueType("llamaGpuOffload", {
    paramType: z.void(),
    schemaMaker: () => {
      return llmLlamaAccelerationSettingSchema;
    },
  })
  .build();

export type KVValueTypeDef = InferKVValueTypeDef<typeof kvValueTypesLibrary>;
