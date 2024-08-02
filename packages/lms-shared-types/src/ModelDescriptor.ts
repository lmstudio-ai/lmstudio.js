import { z } from "zod";

/**
 * Describes a specific loaded LLM.
 *
 * @public
 */
export interface ModelDescriptor {
  /**
   * The identifier of the model (Set when loading the model. Defaults to the same as the path.)
   *
   * Identifier identifies a currently loaded model.
   */
  identifier: string;
  /**
   * The path of the model. (i.e. which model is this)
   *
   * An path is associated with a specific model that can be loaded.
   */
  path: string;
}
export const modelDescriptorSchema = z.object({
  identifier: z.string(),
  path: z.string(),
});
