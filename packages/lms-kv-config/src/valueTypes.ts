import {
  llmContextOverflowPolicySchema,
  llmContextReferenceSchema,
  llmLlamaAccelerationOffloadRatioSchema,
  llmLlamaLogitBiasConfigSchema,
  llmLlamaMirostatSamplingConfigSchema,
  llmPromptTemplateSchema,
  llmStructuredPredictionSettingSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { KVFieldValueTypesLibraryBuilder, type InferKVValueTypeDef } from "./KVConfig";

export const kvValueTypesLibrary = new KVFieldValueTypesLibraryBuilder({
  /**
   * A field can be marked as model centric when it loses its meaning when there is no model to
   * reference.
   *
   * An example would be prompt template. There is no point to configure prompt template when there
   * when there isn't a specific model.
   */
  modelCentric: z.boolean().optional(),
  /**
   * A field can be marked as non-configurable when it is only used as a means to carry information.
   * As a result, it will not be shown in the UI.
   *
   * An example would be context length for MLX, as you cannot change it.
   */
  nonConfigurable: z.boolean().optional(),
  /**
   * A field can be marked as machine dependent when its value is highly dependent on the machine
   * that is being used. When exporting the config, one may decide to not include machine dependent
   * fields by default.
   *
   * An example would be GPU offload settings.
   */
  machineDependent: z.boolean().optional(),
})
  .valueType("numeric", {
    paramType: {
      min: z.number().optional(),
      max: z.number().optional(),
      int: z.boolean().optional(),
      slider: z
        .object({
          min: z.number(),
          max: z.number(),
          step: z.number(),
        })
        .optional(),
      shortHand: z.string().optional(),
    },
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
  .valueType("checkboxNumeric", {
    paramType: {
      min: z.number().optional(),
      max: z.number().optional(),
      int: z.boolean().optional(),
      slider: z
        .object({
          min: z.number(),
          max: z.number(),
          step: z.number(),
        })
        .optional(),
    },
    schemaMaker: ({ min, max, int }) => {
      let numberSchema = z.number();
      if (min !== undefined) {
        numberSchema = numberSchema.min(min);
      }
      if (max !== undefined) {
        numberSchema = numberSchema.max(max);
      }
      if (int) {
        numberSchema = numberSchema.int();
      }
      return z.object({
        checked: z.boolean(),
        value: numberSchema,
      });
    },
  })
  .valueType("string", {
    paramType: {
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
    },
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
    paramType: {},
    schemaMaker: () => {
      return z.boolean();
    },
  })
  .valueType("stringArray", {
    paramType: {
      maxNumItems: z.number().optional(),
      /**
       * Whether to allow empty strings in the array. Default is false.
       */
      allowEmptyStrings: z.boolean().optional(),
    },
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
  .valueType("contextOverflowPolicy", {
    paramType: {},
    schemaMaker: () => {
      return llmContextOverflowPolicySchema;
    },
  })
  .valueType("context", {
    paramType: {},
    schemaMaker: () => {
      return z.array(llmContextReferenceSchema);
    },
  })
  .valueType("contextLength", {
    paramType: {
      max: z.number().optional(),
    },
    schemaMaker: () => {
      return z.number().int().positive();
    },
  })
  .valueType("llmPromptTemplate", {
    paramType: {},
    schemaMaker: () => {
      return llmPromptTemplateSchema;
    },
  })
  .valueType("llamaStructuredOutput", {
    paramType: {},
    schemaMaker: () => {
      return llmStructuredPredictionSettingSchema;
    },
  })
  .valueType("llamaAccelerationOffloadRatio", {
    paramType: {
      numLayers: z.number().optional(),
    },
    schemaMaker: () => {
      return llmLlamaAccelerationOffloadRatioSchema;
    },
  })
  .valueType("llamaAccelerationMainGpu", {
    paramType: {},
    schemaMaker: () => {
      return z.number().int().nonnegative();
    },
  })
  .valueType("llamaAccelerationTensorSplit", {
    paramType: {},
    schemaMaker: () => {
      return z.array(z.number().nonnegative());
    },
  })
  .valueType("llamaMirostatSampling", {
    paramType: {},
    schemaMaker: () => {
      return llmLlamaMirostatSamplingConfigSchema;
    },
  })
  .valueType("llamaLogitBias", {
    paramType: {},
    schemaMaker: () => {
      return llmLlamaLogitBiasConfigSchema;
    },
  })
  .build();

export type KVValueTypeDef = InferKVValueTypeDef<typeof kvValueTypesLibrary>;
