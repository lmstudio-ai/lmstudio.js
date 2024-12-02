import { z } from "zod";

export interface LLMPredictionFragment {
  content: string;
}
export const llmPredictionFragmentSchema = z.object({
  content: z.string(),
});
