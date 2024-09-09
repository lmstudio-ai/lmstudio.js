import { z } from "zod";

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
