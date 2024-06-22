import { z } from "zod";

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
