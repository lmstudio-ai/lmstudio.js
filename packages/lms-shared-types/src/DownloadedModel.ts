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
   * The address of the model. Use to load the model.
   */
  address: string;
  /**
   * The size of the model in bytes.
   */
  sizeBytes: number;
};
export const downloadedModelSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["llm", "embedding"]),
    address: z.string(),
    sizeBytes: z.number(),
  }),
]);
