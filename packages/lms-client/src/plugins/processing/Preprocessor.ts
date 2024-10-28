import { z } from "zod";
import { type ChatMessage } from "../../ChatHistory";
import { type PreprocessorController } from "./ProcessingController";

/**
 * TODO: Documentation
 *
 * @public
 */
export type Preprocessor = (
  ctl: PreprocessorController,
  userMessage: ChatMessage,
) => Promise<string | ChatMessage>;
export const preprocessorSchema = z.function();

/**
 * TODO: Documentation
 *
 * @public
 */
export interface PreprocessorRegistration {
  readonly identifier: string;
  preprocess(ctl: PreprocessorController, userMessage: ChatMessage): Promise<string | ChatMessage>;
}
export const preprocessorRegistrationSchema = z.object({
  identifier: z.string(),
  preprocess: z.function(),
});
