import { z } from "zod";

/**
 * Represents a model that exists locally and can be loaded.
 *
 * @public
 */
export type DownloadedModel = {
  /**
   * The type of the model.
   */
  type: "llm" | "embedding";
  /**
   * The path of the model. Use to load the model.
   */
  path: string;
  /**
   * The size of the model in bytes.
   */
  sizeBytes: number;
  /**
   * The architecture of the model.
   */
  architecture?: string;
};
export const downloadedModelSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("llm"),
    path: z.string(),
    sizeBytes: z.number().int(),
    architecture: z.string().optional(),
  }),
  z.object({
    type: z.literal("embedding"),
    path: z.string(),
    sizeBytes: z.number().int(),
    architecture: z.string().optional(),
  }),
]);
