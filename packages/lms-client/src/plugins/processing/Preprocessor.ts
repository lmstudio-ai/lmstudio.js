import { z } from "zod";
import { type ChatMessage } from "../../ChatHistory.js";
import { type PreprocessorController } from "./ProcessingController.js";

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
