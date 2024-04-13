import { z } from "zod";
import { reasonableKeyStringSchema } from "../reasonable";

/**
 * Represents a query for a loaded LLM.
 *
 * @public
 */
export interface LLMModelQuery {
  /**
   * If specified, the model must have exactly this identifier.
   *
   * Note: The identifier of a model is set when loading the model. It defaults to the address of
   * the model if not specified. However, this default behavior should not be relied upon. If you
   * wish to query a model by its address, you should specify the address instead of the identifier:
   *
   * Instead of
   *
   * ```ts
   * const model = client.llm.get({ identifier: "lmstudio-ai/gemma-2b-it-GGUF" });
   * // OR
   * const model = client.llm.get("lmstudio-ai/gemma-2b-it-GGUF");
   * ```
   *
   * Use
   *
   * ```ts
   * const model = client.llm.get({ address: "lmstudio-ai/gemma-2b-it-GGUF" });
   * ```
   */
  identifier?: string;
  /**
   * If specified, the model must have this address.
   *
   * When specifying the model address, you can use the following format:
   *
   * `<publisher>/<repo>[/model_file]`
   *
   * If `model_file` is not specified, any quantization of the model will match this query.
   *
   * Here are some examples:
   *
   * Query any loaded Gemma 2B model:
   *
   * ```ts
   * const model = client.llm.get({
   *   address: "lmstudio-ai/gemma-2b-it-GGUF",
   * });
   * ```
   *
   * Query any loaded model with a specific quantization of the Gemma 2B model:
   *
   * ```ts
   * const model = client.llm.get({
   *   address: "lmstudio-ai/gemma-2b-it-GGUF/gemma-2b-it-q4_k_m.gguf",
   * });
   * ```
   */
  address?: string;
}
export const llmModelQuerySchema = z.object({
  identifier: reasonableKeyStringSchema.optional(),
  address: reasonableKeyStringSchema.optional(),
});

export const llmModelSpecifierSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("query"),
    query: llmModelQuerySchema,
  }),
  z.object({
    type: z.literal("sessionIdentifier"),
    sessionIdentifier: z.string(),
  }),
]);
export type LLMModelSpecifier = z.infer<typeof llmModelSpecifierSchema>;
