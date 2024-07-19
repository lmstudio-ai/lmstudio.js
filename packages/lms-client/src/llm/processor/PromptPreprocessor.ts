import { type ProcessorInputMessage } from "@lmstudio/lms-shared-types";
import { type PromptPreprocessController } from "./PormptPreprocessorController";

export interface PromptPreprocessor {
  readonly identifier: string;
  preprocess(ctl: PromptPreprocessController): Promise<string | ProcessorInputMessage>;
}
