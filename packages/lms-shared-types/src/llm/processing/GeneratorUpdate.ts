import { z } from "zod";
import {
  processingUpdateCitationBlockCreateSchema,
  processingUpdateContentBlockAppendTextSchema,
  processingUpdateContentBlockAttachGenInfoSchema,
  processingUpdateContentBlockCreateSchema,
  processingUpdateContentBlockReplaceTextSchema,
  processingUpdateDebugInfoBlockCreateSchema,
  processingUpdateStatusCreateSchema,
  processingUpdateStatusRemoveSchema,
  processingUpdateStatusUpdateSchema,
  type ProcessingUpdateCitationBlockCreate,
  type ProcessingUpdateContentBlockAppendText,
  type ProcessingUpdateContentBlockAttachGenInfo,
  type ProcessingUpdateContentBlockCreate,
  type ProcessingUpdateContentBlockReplaceText,
  type ProcessingUpdateDebugInfoBlockCreate,
  type ProcessingUpdateStatusCreate,
  type ProcessingUpdateStatusRemove,
  type ProcessingUpdateStatusUpdate,
} from "./ProcessingUpdate";

export type GeneratorUpdate =
  | ProcessingUpdateStatusCreate
  | ProcessingUpdateStatusUpdate
  | ProcessingUpdateStatusRemove
  | ProcessingUpdateCitationBlockCreate
  | ProcessingUpdateDebugInfoBlockCreate
  | ProcessingUpdateContentBlockCreate
  | ProcessingUpdateContentBlockAppendText
  | ProcessingUpdateContentBlockReplaceText
  | ProcessingUpdateContentBlockAttachGenInfo;
export const generatorUpdateSchema = z.discriminatedUnion("type", [
  processingUpdateStatusCreateSchema,
  processingUpdateStatusUpdateSchema,
  processingUpdateStatusRemoveSchema,
  processingUpdateCitationBlockCreateSchema,
  processingUpdateDebugInfoBlockCreateSchema,
  processingUpdateContentBlockCreateSchema,
  processingUpdateContentBlockAppendTextSchema,
  processingUpdateContentBlockReplaceTextSchema,
  processingUpdateContentBlockAttachGenInfoSchema,
]) as z.Schema<GeneratorUpdate>;
