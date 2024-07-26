import { z } from "zod";
import { type LLMGenInfo, llmGenInfoSchema } from "../LLMPredictionStats";
import {
  type PromptPreprocessorUpdateCitationBlockCreate,
  promptPreprocessorUpdateCitationBlockCreateSchema,
  type PromptPreprocessorUpdateDebugInfoBlockCreate,
  promptPreprocessorUpdateDebugInfoBlockCreateSchema,
  type PromptPreprocessorUpdateStatusCreate,
  promptPreprocessorUpdateStatusCreateSchema,
  type PromptPreprocessorUpdateStatusRemove,
  promptPreprocessorUpdateStatusRemoveSchema,
  type PromptPreprocessorUpdateStatusUpdate,
  promptPreprocessorUpdateStatusUpdateSchema,
} from "./PromptPreprocessorUpdate";

// Content block

export type ProcessorUpdateContentBlockCreate = {
  type: "contentBlock.create";
  id: string;
  includeInContext: boolean;
};
export const processorUpdateContentBlockCreateSchema = z.object({
  type: z.literal("contentBlock.create"),
  id: z.string(),
  includeInContext: z.boolean(),
});

export type ProcessorUpdateContentBlockAppendText = {
  type: "contentBlock.appendText";
  id: string;
  text: string;
};
export const processorUpdateContentBlockAppendTextSchema = z.object({
  type: z.literal("contentBlock.appendText"),
  id: z.string(),
  text: z.string(),
});

export type ProcessorUpdateContentBlockAttachGenInfo = {
  type: "contentBlock.attachGenInfo";
  id: string;
  genInfo: LLMGenInfo;
};
export const processorUpdateContentBlockAttachGenInfoSchema = z.object({
  type: z.literal("contentBlock.attachGenInfo"),
  id: z.string(),
  genInfo: llmGenInfoSchema,
});

// Status

export type ProcessorUpdateStatusCreate = PromptPreprocessorUpdateStatusCreate;
export const processorUpdateStatusCreateSchema = promptPreprocessorUpdateStatusCreateSchema;

export type ProcessorUpdateStatusUpdate = PromptPreprocessorUpdateStatusUpdate;
export const processorUpdateStatusUpdateSchema = promptPreprocessorUpdateStatusUpdateSchema;

export type ProcessorUpdateStatusRemove = PromptPreprocessorUpdateStatusRemove;
export const processorUpdateStatusRemoveSchema = promptPreprocessorUpdateStatusRemoveSchema;

export type ProcessorUpdateCitationBlockCreate = PromptPreprocessorUpdateCitationBlockCreate;
export const processorUpdateCitationBlockCreateSchema =
  promptPreprocessorUpdateCitationBlockCreateSchema;

// Debug Info Block

export type ProcessorUpdateDebugInfoBlockCreate = PromptPreprocessorUpdateDebugInfoBlockCreate;
export const processorUpdateDebugInfoBlockCreateSchema =
  promptPreprocessorUpdateDebugInfoBlockCreateSchema;

// Combined

export type ProcessorUpdate =
  | ProcessorUpdateContentBlockCreate
  | ProcessorUpdateContentBlockAppendText
  | ProcessorUpdateContentBlockAttachGenInfo
  | ProcessorUpdateStatusCreate
  | ProcessorUpdateStatusUpdate
  | ProcessorUpdateStatusRemove
  | ProcessorUpdateCitationBlockCreate
  | ProcessorUpdateDebugInfoBlockCreate;
export const processorUpdateSchema = z.discriminatedUnion("type", [
  processorUpdateContentBlockCreateSchema,
  processorUpdateContentBlockAppendTextSchema,
  processorUpdateContentBlockAttachGenInfoSchema,
  processorUpdateStatusCreateSchema,
  processorUpdateStatusUpdateSchema,
  processorUpdateStatusRemoveSchema,
  processorUpdateCitationBlockCreateSchema,
  processorUpdateDebugInfoBlockCreateSchema,
]) as z.Schema<ProcessorUpdate>;

export type ProcessorUpdateOf<TType extends ProcessorUpdate["type"]> = Extract<
  ProcessorUpdate,
  { type: TType }
>;
