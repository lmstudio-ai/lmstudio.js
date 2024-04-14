import { z } from "zod";

/**
 * Represents a model that exists locally and can be loaded.
 *
 * @public
 */
export type DownloadedModel = {
  type: "llm" | "embedding";
  address: string;
};
export const downloadedModelSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["llm", "embedding"]),
    address: z.string(),
  }),
]);
