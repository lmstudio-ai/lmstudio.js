import { z } from "zod";

/**
 * Describes a specific loaded LLM.
 *
 * @public
 */
export interface LLMDescriptor {
  /**
   * The identifier of the LLM (Set when loading the model. Defaults to the same as the address.)
   *
   * Identifier identifies a currently loaded model.
   */
  identifier: string;
  /**
   * The address of the LLMModel. (i.e. which model is this)
   *
   * An address is associated with a specific model that can be loaded.
   */
  address: string;
}
export const llmDescriptorSchema = z.object({
  identifier: z.string(),
  address: z.string(),
});
