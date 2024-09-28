import { z } from "zod";
import { citationSourceSchema, type CitationSource } from "../../CitationSource";
import { llmGenInfoSchema, type LLMGenInfo } from "../LLMPredictionStats";

export type BlockLocation =
  | {
      type: "beforeId";
      id: string;
    }
  | {
      type: "afterId";
      id: string;
    };
export const blockLocationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("beforeId"),
    id: z.string(),
  }),
  z.object({
    type: z.literal("afterId"),
    id: z.string(),
  }),
]) as z.Schema<BlockLocation>;

// Status

/**
 * @public
 */
export type StatusStepStatus = "waiting" | "loading" | "done" | "error" | "canceled";
export const statusStepStatusSchema = z.enum([
  "waiting",
  "loading",
  "done",
  "error",
  "canceled",
]) as z.Schema<StatusStepStatus>;

/**
 * @public
 */
export interface StatusStepState {
  status: StatusStepStatus;
  text: string;
}
export const statusStepStateSchema = z.object({
  status: statusStepStatusSchema,
  text: z.string(),
}) as z.Schema<StatusStepState>;

export type ProcessingUpdateStatusCreate = {
  type: "status.create";
  id: string;
  state: StatusStepState;
  location?: BlockLocation;
  indentation?: number;
};
export const ProcessingUpdateStatusCreateSchema = z.object({
  type: z.literal("status.create"),
  id: z.string(),
  state: statusStepStateSchema,
  location: blockLocationSchema.optional(),
  indentation: z.number().optional(),
});

export type ProcessingUpdateStatusUpdate = {
  type: "status.update";
  id: string;
  state: StatusStepState;
};
export const ProcessingUpdateStatusUpdateSchema = z.object({
  type: z.literal("status.update"),
  id: z.string(),
  state: statusStepStateSchema,
});

export type ProcessingUpdateStatusRemove = {
  type: "status.remove";
  id: string;
};
export const ProcessingUpdateStatusRemoveSchema = z.object({
  type: z.literal("status.remove"),
  id: z.string(),
});

export type ProcessingUpdateCitationBlockCreate = {
  type: "citationBlock.create";
  id: string;
  citedText: string;
  source: CitationSource;
};
export const ProcessingUpdateCitationBlockCreateSchema = z.object({
  type: z.literal("citationBlock.create"),
  id: z.string(),
  citedText: z.string(),
  source: citationSourceSchema,
});

// Debug Info Block

export type ProcessingUpdateDebugInfoBlockCreate = {
  type: "debugInfoBlock.create";
  id: string;
  debugInfo: string;
};
export const ProcessingUpdateDebugInfoBlockCreateSchema = z.object({
  type: z.literal("debugInfoBlock.create"),
  id: z.string(),
  debugInfo: z.string(),
});

// Content block

export type ProcessingUpdateContentBlockCreate = {
  type: "contentBlock.create";
  id: string;
  includeInContext: boolean;
  label?: string;
};
export const ProcessingUpdateContentBlockCreateSchema = z.object({
  type: z.literal("contentBlock.create"),
  id: z.string(),
  includeInContext: z.boolean(),
  label: z.string().optional(),
});

export type ProcessingUpdateContentBlockAppendText = {
  type: "contentBlock.appendText";
  id: string;
  text: string;
};
export const ProcessingUpdateContentBlockAppendTextSchema = z.object({
  type: z.literal("contentBlock.appendText"),
  id: z.string(),
  text: z.string(),
});

export type ProcessingUpdateContentBlockAttachGenInfo = {
  type: "contentBlock.attachGenInfo";
  id: string;
  genInfo: LLMGenInfo;
};
export const ProcessingUpdateContentBlockAttachGenInfoSchema = z.object({
  type: z.literal("contentBlock.attachGenInfo"),
  id: z.string(),
  genInfo: llmGenInfoSchema,
});

// Combined

export type ProcessingUpdate =
  | ProcessingUpdateStatusCreate
  | ProcessingUpdateStatusUpdate
  | ProcessingUpdateStatusRemove
  | ProcessingUpdateCitationBlockCreate
  | ProcessingUpdateDebugInfoBlockCreate
  | ProcessingUpdateContentBlockCreate
  | ProcessingUpdateContentBlockAppendText
  | ProcessingUpdateContentBlockAttachGenInfo;
export const ProcessingUpdateSchema = z.discriminatedUnion("type", [
  ProcessingUpdateStatusCreateSchema,
  ProcessingUpdateStatusUpdateSchema,
  ProcessingUpdateStatusRemoveSchema,
  ProcessingUpdateCitationBlockCreateSchema,
  ProcessingUpdateDebugInfoBlockCreateSchema,
  ProcessingUpdateContentBlockCreateSchema,
  ProcessingUpdateContentBlockAppendTextSchema,
  ProcessingUpdateContentBlockAttachGenInfoSchema,
]) as z.Schema<ProcessingUpdate>;

export type ProcessingUpdateType = ProcessingUpdate["type"];

export type ProcessingUpdateOf<TType extends ProcessingUpdate["type"]> = Extract<
  ProcessingUpdate,
  { type: TType }
>;
