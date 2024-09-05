import { type ChatMessage } from "@lmstudio/lms-common";
import { z } from "zod";
import { type PreprocessorController } from "./ProcessingController";

/**
 * TODO: Documentation
 *
 * @public
 */
export interface Preprocessor {
  readonly identifier: string;
  preprocess(ctl: PreprocessorController, userMessage: ChatMessage): Promise<string | ChatMessage>;
}
export const preprocessorSchema = z.object({
  identifier: z.string(),
  preprocess: z.function(),
});
