import { z } from "zod";
import { type ChatMessage } from "../../ChatHistory";
import { type PreprocessorController } from "./ProcessingController";

/**
 * TODO: Documentation
 *
 * @public
 */
export interface Preprocessor {
  readonly identifier: string;
  preprocess(ctl: PreprocessorController, input: ChatMessage): Promise<string | ChatMessage>;
}
export const preprocessorSchema = z.object({
  identifier: z.string(),
  preprocess: z.function(),
});
