import {
  llmContextOverflowPolicySchema,
  llmContextReferenceSchema,
  llmLlamaAccelerationOffloadRatioSchema,
  llmLlamaLogitBiasConfigSchema,
  llmLlamaMirostatSamplingConfigSchema,
  llmPromptTemplateSchema,
  llmStructuredPredictionSettingSchema,
  modelDomainTypeSchema,
  retrievalChunkingMethodSchema,
} from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { deepEquals, KVFieldValueTypesLibraryBuilder, type InferKVValueTypeDef } from "./KVConfig";

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
  warning: z.string().optional(),
  isExperimental: z.boolean().optional(),
})
  .valueType("numeric", {
    paramType: {
      min: z.number().optional(),
      max: z.number().optional(),
      int: z.boolean().optional(),
      precision: z.number().int().nonnegative().optional(),
      slider: z
        .object({
          min: z.number(),
          max: z.number(),
          step: z.number(),
        })
        .optional(),
      shortHand: z.string().optional(),
    },
    schemaMaker: ({ min, max, int, precision }) => {
      let schema = z.number();
      if (min !== undefined) {
        schema = schema.min(min);
      }
      if (max !== undefined) {
        schema = schema.max(max);
      }
      if (int) {
        if (precision !== undefined) {
          throw new Error("Cannot specify both int and precision.");
        }
        schema = schema.int();
      }
      return schema;
    },
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: (value, { int, precision }) => {
      if (int) {
        return String(Math.round(value));
      }
      return value.toFixed(precision ?? 2);
    },
  })
  .valueType("checkboxNumeric", {
    paramType: {
      min: z.number().optional(),
      max: z.number().optional(),
      int: z.boolean().optional(),
      precision: z.number().int().nonnegative().optional(),
      slider: z
        .object({
          min: z.number(),
          max: z.number(),
          step: z.number(),
        })
        .optional(),
    },
    schemaMaker: ({ min, max, int, precision }) => {
      let numberSchema = z.number();
      if (min !== undefined) {
        numberSchema = numberSchema.min(min);
      }
      if (max !== undefined) {
        numberSchema = numberSchema.max(max);
      }
      if (int) {
        if (precision !== undefined) {
          throw new Error("Cannot specify both int and precision.");
        }
        numberSchema = numberSchema.int();
      }
      return z.object({
        checked: z.boolean(),
        value: numberSchema,
      });
    },
    effectiveEquals: (a, b) => {
      if (a.checked !== b.checked) {
        return false;
      }
      if (!a.checked) {
        return true;
      }
      return a.value === b.value;
    },
    stringify: (value, { int, precision }, { t }) => {
      if (!value.checked) {
        return t("config:customInputs.checkboxNumeric.off", "OFF");
      }
      if (int) {
        return String(Math.round(value.value));
      }
      return value.value.toFixed(precision ?? 2);
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
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: value => {
      return value;
    },
  })
  .valueType("boolean", {
    paramType: {},
    schemaMaker: () => {
      return z.boolean();
    },
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: value => {
      return value ? "ON" : "OFF";
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
    effectiveEquals: (a, b) => {
      return a.length === b.length && a.every((v, i) => v === b[i]);
    },
    stringify: (value, _typeParam, { t, desiredLength }) => {
      if (value.length === 0) {
        return t("config:customInputs.stringArray.empty", "Empty");
      }
      if (value.length <= 2 || desiredLength === undefined) {
        return value.join(", ");
      }
      // Desired length does not need to be followed strictly. It is just a hint.
      let currentLength = value[0].length + value[1].length + 6;
      for (let i = 1; i < value.length - 1; i++) {
        currentLength += value[i].length + 2;
        if (currentLength >= desiredLength) {
          return value.slice(0, i).join(", ") + ", ..." + value[value.length - 1];
        }
      }
      return value.join(", ");
    },
  })
  .valueType("contextOverflowPolicy", {
    paramType: {},
    schemaMaker: () => {
      return llmContextOverflowPolicySchema;
    },
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: (value, _typeParam, { t }) => {
      switch (value) {
        case "stopAtLimit":
          return t("config:customInputs.contextOverflowPolicy.stopAtLimit", "Stop At Limit");
        case "truncateMiddle":
          return t("config:customInputs.contextOverflowPolicy.truncateMiddle", "Truncate Middle");
        case "rollingWindow":
          return t("config:customInputs.contextOverflowPolicy.rollingWindow", "Rolling Window");
      }
    },
  })
  .valueType("context", {
    paramType: {},
    schemaMaker: () => {
      return z.array(llmContextReferenceSchema);
    },
    effectiveEquals: (a, b) => {
      return deepEquals(a, b);
    },
    stringify: value => {
      return JSON.stringify(value, null, 2); // TODO: pretty print
    },
  })
  .valueType("contextLength", {
    paramType: {
      max: z.number().optional(),
    },
    schemaMaker: () => {
      return z.number().int().positive();
    },
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: (value, { max }) => {
      if (max === undefined) {
        return String(value);
      }
      return `${value}/${max}`;
    },
  })
  .valueType("modelIdentifier", {
    paramType: {
      domain: z.array(modelDomainTypeSchema).optional(),
    },
    schemaMaker: () => {
      return z.string();
    },
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: value => {
      return value;
    },
  })
  .valueType("llmPromptTemplate", {
    paramType: {},
    schemaMaker: () => {
      return llmPromptTemplateSchema;
    },
    effectiveEquals: (a, b) => {
      if (a.type !== b.type) {
        return false;
      }
      if (a.stopStrings.length !== b.stopStrings.length) {
        return false;
      }
      if (!a.stopStrings.every((v, i) => v === b.stopStrings[i])) {
        return false;
      }
      switch (a.type) {
        case "jinja":
          return (
            a.jinjaPromptTemplate?.bosToken === b.jinjaPromptTemplate?.bosToken &&
            a.jinjaPromptTemplate?.eosToken === b.jinjaPromptTemplate?.eosToken &&
            a.jinjaPromptTemplate?.template === b.jinjaPromptTemplate?.template
          );
        case "manual":
          return (
            a.manualPromptTemplate?.beforeSystem === b.manualPromptTemplate?.beforeSystem &&
            a.manualPromptTemplate?.afterSystem === b.manualPromptTemplate?.afterSystem &&
            a.manualPromptTemplate?.beforeUser === b.manualPromptTemplate?.beforeUser &&
            a.manualPromptTemplate?.afterUser === b.manualPromptTemplate?.afterUser &&
            a.manualPromptTemplate?.beforeAssistant === b.manualPromptTemplate?.beforeAssistant &&
            a.manualPromptTemplate?.afterAssistant === b.manualPromptTemplate?.afterAssistant
          );
        default: {
          const exhaustiveCheck: never = a.type;
          throw new Error("Unknown template type: " + exhaustiveCheck);
        }
      }
    },
    stringify: (value, _typeParam, { t, desiredLength }) => {
      switch (value.type) {
        case "jinja": {
          const lead =
            `${t("config:customInputs.llmPromptTemplate.type", "Type")}: ` +
            `${t("config:customInputs.llmPromptTemplate.types.jinja/label", "Jinja")}\n` +
            `${t("config:customInputs.llmPromptTemplate.jinja.bosToken/label", "BOS Token")}: ` +
            `${value.jinjaPromptTemplate?.bosToken}\n` +
            `${t("config:customInputs.llmPromptTemplate.jinja.eosToken/label", "EOS Token")}: ` +
            `${value.jinjaPromptTemplate?.eosToken}\n` +
            `${t("config:customInputs.llmPromptTemplate.jinja.template/label", "Template")}: `;
          if (desiredLength === undefined) {
            return lead + value.jinjaPromptTemplate?.template;
          }
          const currentLength = lead.length;
          const remainingLength = Math.min(100, desiredLength - currentLength);
          const template = value.jinjaPromptTemplate?.template ?? "";
          if (template.length <= remainingLength) {
            return lead + template;
          }
          return (
            lead +
            template.slice(0, Math.floor(remainingLength / 2)) +
            "..." +
            template.slice(-Math.ceil(remainingLength / 2))
          );
        }
        case "manual":
          return (
            `${t("config:customInputs.llmPromptTemplate.type", "Type")}: ` +
            `${t("config:customInputs.llmPromptTemplate.types.manual/label", "Manual")}\n` +
            `${t("config:customInputs.llmPromptTemplate.manual.subfield.beforeSystem/label", "Before System")}: ` +
            `${value.manualPromptTemplate?.beforeSystem?.replaceAll("\n", "\\n")}\n` +
            `${t("config:customInputs.llmPromptTemplate.manual.subfield.afterSystem/label", "After System")}: ` +
            `${value.manualPromptTemplate?.afterSystem?.replaceAll("\n", "\\n")}\n` +
            `${t("config:customInputs.llmPromptTemplate.manual.subfield.beforeUser/label", "Before User")}: ` +
            `${value.manualPromptTemplate?.beforeUser?.replaceAll("\n", "\\n")}\n` +
            `${t("config:customInputs.llmPromptTemplate.manual.subfield.afterUser/label", "After User")}: ` +
            `${value.manualPromptTemplate?.afterUser?.replaceAll("\n", "\\n")}\n` +
            `${t("config:customInputs.llmPromptTemplate.manual.subfield.beforeAssistant/label", "Before Assistant")}: ` +
            `${value.manualPromptTemplate?.beforeAssistant?.replaceAll("\n", "\\n")}\n` +
            `${t("config:customInputs.llmPromptTemplate.manual.subfield.afterAssistant/label", "After Assistant")}: ` +
            `${value.manualPromptTemplate?.afterAssistant?.replaceAll("\n", "\\n")}`
          );
        default: {
          const exhaustiveCheck: never = value.type;
          throw new Error("Unknown template type: " + exhaustiveCheck);
        }
      }
    },
  })
  .valueType("llamaStructuredOutput", {
    paramType: {},
    schemaMaker: () => {
      return llmStructuredPredictionSettingSchema;
    },
    effectiveEquals: (a, b) => {
      return deepEquals(a, b); // TODO: more performant comparison
    },
    stringify: value => {
      return JSON.stringify(value, null, 2); // TODO: pretty print
    },
  })
  .valueType("llamaAccelerationOffloadRatio", {
    paramType: {
      numLayers: z.number().optional(),
    },
    schemaMaker: () => {
      return llmLlamaAccelerationOffloadRatioSchema;
    },
    effectiveEquals: (a, b) => {
      const ratioA = a === "max" ? 1 : a === "off" ? 0 : a;
      const ratioB = b === "max" ? 1 : b === "off" ? 0 : b;
      return ratioA === ratioB;
    },
    stringify: (value, { numLayers }, { t }) => {
      if (value === "max" || value === 1) {
        const label = t("config:customInputs.llamaAccelerationOffloadRatio.max", "MAX");
        if (numLayers !== 0) {
          return `${label} (${numLayers})`;
        }
        return label;
      }
      if (value === "off" || value === 0) {
        return t("config:customInputs.llamaAccelerationOffloadRatio.off", "OFF");
      }
      if (numLayers !== undefined) {
        return String(Math.round(numLayers * value));
      }
      return (value * 100).toFixed(0) + "%";
    },
  })
  .valueType("llamaAccelerationMainGpu", {
    paramType: {},
    schemaMaker: () => {
      return z.number().int().nonnegative();
    },
    effectiveEquals: (a, b) => {
      return a === b;
    },
    stringify: value => {
      return String(value); // TODO: Show GPU name
    },
  })
  .valueType("llamaAccelerationTensorSplit", {
    paramType: {},
    schemaMaker: () => {
      return z.array(z.number().nonnegative());
    },
    effectiveEquals: (a, b) => {
      return deepEquals(a, b); // TODO: more performant comparison
    },
    stringify: value => {
      return value.join(", "); // TODO: Better display
    },
  })
  .valueType("llamaMirostatSampling", {
    paramType: {},
    schemaMaker: () => {
      return llmLlamaMirostatSamplingConfigSchema;
    },
    effectiveEquals: (a, b) => {
      return deepEquals(a, b); // TODO: more performant comparison
    },
    stringify: value => {
      return JSON.stringify(value, null, 2); // TODO: pretty print
    },
  })
  .valueType("llamaLogitBias", {
    paramType: {},
    schemaMaker: () => {
      return llmLlamaLogitBiasConfigSchema;
    },
    effectiveEquals: (a, b) => {
      return deepEquals(a, b); // TODO: more performant comparison
    },
    stringify: value => {
      return JSON.stringify(value, null, 2); // TODO: pretty print
    },
  })
  .valueType("retrievalChunkingMethod", {
    paramType: {},
    schemaMaker: () => {
      return retrievalChunkingMethodSchema;
    },
    effectiveEquals: (a, b) => {
      return deepEquals(a, b); // TODO: more performant comparison
    },
    stringify: value => {
      return JSON.stringify(value, null, 2); // TODO: pretty print
    },
  })
  .build();

export type KVValueTypeDef = InferKVValueTypeDef<typeof kvValueTypesLibrary>;
