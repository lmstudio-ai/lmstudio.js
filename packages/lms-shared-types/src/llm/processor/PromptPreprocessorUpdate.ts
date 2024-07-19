import { z } from "zod";

// Status

export type StatusStepStatus = "waiting" | "loading" | "done" | "error" | "canceled";
export const statusStepStatusSchema = z.enum([
  "waiting",
  "loading",
  "done",
  "error",
  "canceled",
]) as z.Schema<StatusStepStatus>;

export interface StatusStepState {
  status: StatusStepStatus;
  text: string;
}
export const statusStepStateSchema = z.object({
  status: statusStepStatusSchema,
  text: z.string(),
}) as z.Schema<StatusStepState>;

type PromptPreprocessorUpdateStatusCreate = {
  type: "status.create";
  id: string;
  state: StatusStepState;
};
const promptPreprocessorUpdateStatusCreateSchema = z.object({
  type: z.literal("status.create"),
  id: z.string(),
  state: statusStepStateSchema,
});

type PromptPreprocessorUpdateStatusUpdate = {
  type: "status.update";
  id: string;
  state: StatusStepState;
};
const promptPreprocessorUpdateStatusUpdateSchema = z.object({
  type: z.literal("status.update"),
  id: z.string(),
  state: statusStepStateSchema,
});

// Citation Block

export interface CitationSource {
  fileName: string;
  absoluteFilePath: string;
  pageNumber?: number | [number, number];
  lineNumber?: number | [number, number];
}
export const citationSourceSchema = z.object({
  fileName: z.string(),
  absoluteFilePath: z.string(),
  pageNumber: z.union([z.number(), z.array(z.number())]).optional(),
  lineNumber: z.union([z.number(), z.array(z.number())]).optional(),
}) as z.Schema<CitationSource>;

type PromptPreprocessorUpdateCitationBlockCreate = {
  type: "citationBlock.create";
  id: string;
  citedText: string;
  source: CitationSource;
};
const promptPreprocessorUpdateCitationBlockCreateSchema = z.object({
  type: z.literal("citationBlock.create"),
  id: z.string(),
  citedText: z.string(),
  source: citationSourceSchema,
});

// Debug Info Block

type PromptPreprocessorUpdateDebugInfoBlockCreate = {
  type: "debugInfoBlock.create";
  id: string;
  debugInfo: string;
};
const promptPreprocessorUpdateDebugInfoBlockCreateSchema = z.object({
  type: z.literal("debugInfoBlock.create"),
  id: z.string(),
  debugInfo: z.string(),
});

// Combined

export type PromptPreprocessorUpdate =
  | PromptPreprocessorUpdateStatusCreate
  | PromptPreprocessorUpdateStatusUpdate
  | PromptPreprocessorUpdateCitationBlockCreate
  | PromptPreprocessorUpdateDebugInfoBlockCreate;
export const promptPreprocessorUpdateSchema = z.discriminatedUnion("type", [
  promptPreprocessorUpdateStatusCreateSchema,
  promptPreprocessorUpdateStatusUpdateSchema,
  promptPreprocessorUpdateCitationBlockCreateSchema,
  promptPreprocessorUpdateDebugInfoBlockCreateSchema,
]) as z.Schema<PromptPreprocessorUpdate>;

export type PromptPreprocessorUpdateOf<TType extends PromptPreprocessorUpdate["type"]> = Extract<
  PromptPreprocessorUpdate,
  { type: TType }
>;
