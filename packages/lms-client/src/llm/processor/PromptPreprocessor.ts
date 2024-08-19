import { type ProcessorInputMessage } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import { type PromptPreprocessController } from "./PromptPreprocessorController";

/**
 * TODO: Documentation
 *
 * @public
 */
export interface PromptPreprocessor {
  readonly identifier: string;
  preprocess(ctl: PromptPreprocessController): Promise<string | ProcessorInputMessage>;
}
export const promptPreprocessorSchema = z.object({
  identifier: z.string(),
  preprocess: z.function(),
});
