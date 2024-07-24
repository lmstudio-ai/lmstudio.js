import { z } from "zod";

/**
 * Options for applying a prompt template.
 * @public
 */
export interface LLMApplyPromptTemplateOpts {
  /**
   * Whether to omit the BOS token when formatting.
   *
   * Default: false
   */
  omitBosToken?: boolean;
  /**
   * Whether to omit the EOS token when formatting.
   *
   * Default: false
   */
  omitEosToken?: boolean;
}
export const llmApplyPromptTemplateOptsSchema = z.object({
  omitBosToken: z.boolean().optional(),
  omitEosToken: z.boolean().optional(),
});
