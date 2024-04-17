import { z } from "zod";

/**
 * Describes a specific loaded LLM.
 *
 * @public
 */
export interface LLMDescriptor {
  /**
   * The identifier of the LLM (Set when loading the model. Defaults to the same as the path.)
   *
   * Identifier identifies a currently loaded model.
   */
  identifier: string;
  /**
   * The path of the LLMModel. (i.e. which model is this)
   *
   * An path is associated with a specific model that can be loaded.
   */
  path: string;
}
export const llmDescriptorSchema = z.object({
  identifier: z.string(),
  path: z.string(),
});
