import { z, type ZodSchema } from "zod";

/**
 * @public
 */
export interface DownloadProgressUpdate {
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSecond: number;
}
export const downloadProgressUpdateSchema = z.object({
  downloadedBytes: z.number().int(),
  totalBytes: z.number().int(),
  speedBytesPerSecond: z.number(),
}) as ZodSchema<DownloadProgressUpdate>;
