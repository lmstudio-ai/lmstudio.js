import { z } from "zod";

export interface LLMPredictionFragment {
  /**
   * String content of the fragment.
   */
  content: string;
  /**
   * Number of tokens contains in this fragment.
   */
  tokensCount: number;
  /**
   * Whether this fragment contains tokens from the draft model.
   */
  containsDrafted: boolean;
}
export const llmPredictionFragmentSchema = z.object({
  content: z.string(),
  tokensCount: z.number().int(),
  containsDrafted: z.boolean(),
});
