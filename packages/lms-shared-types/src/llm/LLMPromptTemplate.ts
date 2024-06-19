import { z } from "zod";

/**
 * Currently not supported. We might remove it in the future.
 */
export interface LLMLegacyPromptTemplate {
  type: "legacy";
  inputPrefix: string;
  inputSuffix: string;
  prePromptPrefix: string;
  prePromptSuffix: string;
}
export const llmLegacyPromptTemplateSchema = z.object({
  type: z.literal("legacy"),
  inputPrefix: z.string(),
  inputSuffix: z.string(),
  prePromptPrefix: z.string(),
  prePromptSuffix: z.string(),
});

export interface LLMJinjaPromptTemplate {
  type: "jinja";
  template: string;
  /**
   * Required for applying Jinja template.
   */
  bosToken: string;
  /**
   * Required for applying Jinja template.
   */
  eosToken: string;
}
export const llmJinjaPromptTemplateSchema = z.object({
  type: z.literal("jinja"),
  template: z.string(),
  bosToken: z.string(),
  eosToken: z.string(),
});

export type LLMPromptTemplate = LLMLegacyPromptTemplate | LLMJinjaPromptTemplate;
export const llmPromptTemplateSchema = z.discriminatedUnion("type", [
  llmLegacyPromptTemplateSchema,
  llmJinjaPromptTemplateSchema,
]);
