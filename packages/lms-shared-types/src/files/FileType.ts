import { z } from "zod";

/**
 * @public
 *
 * TODO: Documentation
 */
export type FileType =
  | "image"
  | "text/plain"
  | "application/pdf"
  | "application/word"
  | "text/other"
  | "unknown";
export const fileTypeSchema = z.enum([
  "image",
  "text/plain",
  "application/pdf",
  "application/word",
  "text/other",
  "unknown",
]);
