import { z } from "zod";

/**
 * @public
 */
export interface LLMManualPromptTemplate {
  /**
   * String to be prepended to the system prompt.
   */
  beforeSystem: string;
  /**
   * String to be appended to the system prompt.
   */
  afterSystem: string;
  /**
   * String to be prepended to a user message.
   */
  beforeUser: string;
  /**
   * String to be appended to a user message.
   */
  afterUser: string;
  /**
   * String to be prepended to an assistant message.
   */
  beforeAssistant: string;
  /**
   * String to be appended to an assistant message.
   */
  afterAssistant: string;
}
export const llmManualPromptTemplateSchema = z.object({
  beforeSystem: z.string(),
  afterSystem: z.string(),
  beforeUser: z.string(),
  afterUser: z.string(),
  beforeAssistant: z.string(),
  afterAssistant: z.string(),
});

// TODO(matt): document well
/**
 * @public
 */
export type LLMJinjaInputFormat =
  | "promptOnly"
  | "promptWithImages"
  | "promptWithImagesNewline"
  | "promptWithNumberedImages1"
  | "promptWithNumberedImages2"
  | "messageListWithImageType1"
  | "messageListWithImageType2";
export const llmJinjaInputFormatSchema = z.enum([
  "promptOnly",
  "promptWithImages",
  "promptWithImagesNewline",
  "promptWithNumberedImages1",
  "promptWithNumberedImages2",
  "messageListWithImageType1",
  "messageListWithImageType2",
]);

/**
 * @public
 */
export interface LLMJinjaPromptTemplate {
  template: string;
  /**
   * Required for applying Jinja template.
   */
  bosToken: string;
  /**
   * Required for applying Jinja template.
   */
  eosToken: string;
  /**
   * Format of the input to the Jinja template.
   */
  inputFormat?: LLMJinjaInputFormat;
}
export const llmJinjaPromptTemplateSchema = z.object({
  template: z.string(),
  bosToken: z.string(),
  eosToken: z.string(),
  inputFormat: llmJinjaInputFormatSchema.optional(),
});

/** @public */
export type LLMPromptTemplateType = "manual" | "jinja";
export const llmPromptTemplateTypeSchema = z.enum(["manual", "jinja"]);

/**
 * @public
 */
export interface LLMPromptTemplate {
  type: LLMPromptTemplateType;
  manualPromptTemplate?: LLMManualPromptTemplate;
  jinjaPromptTemplate?: LLMJinjaPromptTemplate;
  /**
   * Additional stop strings to be used with this template.
   */
  stopStrings: Array<string>;
}
export const llmPromptTemplateSchema = z.object({
  type: llmPromptTemplateTypeSchema,
  manualPromptTemplate: llmManualPromptTemplateSchema.optional(),
  jinjaPromptTemplate: llmJinjaPromptTemplateSchema.optional(),
  stopStrings: z.array(z.string()),
});
