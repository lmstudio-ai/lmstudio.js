import { z } from "zod";

/**
 * Represents the type of this fragment in terms of reasoning.
 *
 * - `none`: Content outside of a reasoning block.
 * - `reasoning`: Content inside a reasoning block.
 * - `reasoningStartTag`: Start tag of a reasoning block.
 * - `reasoningEndTag`: End tag of a reasoning block.
 */
export type LLMPredictionFragmentReasoningType =
  | "none"
  | "reasoning"
  | "reasoningStartTag"
  | "reasoningEndTag";
export const llmPredictionFragmentReasoningTypeSchema = z.enum([
  "none",
  "reasoning",
  "reasoningStartTag",
  "reasoningEndTag",
]);

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
  /**
   * Type of reasoning for this fragment. See {@link LLMPredictionFragmentReasoningType} for more
   * info.
   */
  reasoningType: LLMPredictionFragmentReasoningType;
}
export const llmPredictionFragmentSchema = z.object({
  content: z.string(),
  tokensCount: z.number().int(),
  containsDrafted: z.boolean(),
  reasoningType: llmPredictionFragmentReasoningTypeSchema,
});
