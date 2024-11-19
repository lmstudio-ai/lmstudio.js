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
