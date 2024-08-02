import { z } from "zod";

export type ProcessorInputMessageRole = "system" | "user" | "assistant";
export const processorInputMessageRoleSchema = z.enum(["system", "user", "assistant"]);

export type ProcessorInputFileType =
  | "image"
  | "text/plain"
  | "application/pdf"
  | "application/word"
  | "unknown";
export const processorInputFileTypeSchema = z.enum([
  "image",
  "text/plain",
  "application/pdf",
  "application/word",
  "unknown",
]);

/**
 * TODO: documentation
 * @public
 */
export interface ProcessorInputFile {
  identifier: string;
  type: ProcessorInputFileType;
  sizeBytes: number;
}
export const processorInputFileSchema = z.object({
  identifier: z.string(),
  type: processorInputFileTypeSchema,
  sizeBytes: z.number(),
});

export interface ProcessorInputMessage {
  role: ProcessorInputMessageRole;
  text: string;
  /**
   * Files attached to this message.
   */
  files: Array<ProcessorInputFile>;
}
export const processorInputMessageSchema = z.object({
  role: processorInputMessageRoleSchema,
  text: z.string(),
  files: z.array(processorInputFileSchema),
});

export interface ProcessorInputContext {
  history: Array<ProcessorInputMessage>;
}
export const processorInputContextSchema = z.object({
  history: z.array(processorInputMessageSchema),
});
