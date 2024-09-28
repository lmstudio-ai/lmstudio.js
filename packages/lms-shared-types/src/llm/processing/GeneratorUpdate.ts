import { z } from "zod";
import {
  ProcessingUpdateCitationBlockCreateSchema,
  ProcessingUpdateContentBlockAppendTextSchema,
  ProcessingUpdateContentBlockAttachGenInfoSchema,
  ProcessingUpdateContentBlockCreateSchema,
  ProcessingUpdateDebugInfoBlockCreateSchema,
  ProcessingUpdateStatusCreateSchema,
  ProcessingUpdateStatusRemoveSchema,
  ProcessingUpdateStatusUpdateSchema,
  type ProcessingUpdateCitationBlockCreate,
  type ProcessingUpdateContentBlockAppendText,
  type ProcessingUpdateContentBlockAttachGenInfo,
  type ProcessingUpdateContentBlockCreate,
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
  | ProcessingUpdateContentBlockAttachGenInfo;
export const generatorUpdateSchema = z.discriminatedUnion("type", [
  ProcessingUpdateStatusCreateSchema,
  ProcessingUpdateStatusUpdateSchema,
  ProcessingUpdateStatusRemoveSchema,
  ProcessingUpdateCitationBlockCreateSchema,
  ProcessingUpdateDebugInfoBlockCreateSchema,
  ProcessingUpdateContentBlockCreateSchema,
  ProcessingUpdateContentBlockAppendTextSchema,
  ProcessingUpdateContentBlockAttachGenInfoSchema,
]) as z.Schema<GeneratorUpdate>;
