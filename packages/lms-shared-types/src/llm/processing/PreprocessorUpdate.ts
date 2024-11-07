import { z } from "zod";
import {
  processingUpdateCitationBlockCreateSchema,
  processingUpdateDebugInfoBlockCreateSchema,
  processingUpdateStatusCreateSchema,
  processingUpdateStatusRemoveSchema,
  processingUpdateStatusUpdateSchema,
  type ProcessingUpdateCitationBlockCreate,
  type ProcessingUpdateDebugInfoBlockCreate,
  type ProcessingUpdateStatusCreate,
  type ProcessingUpdateStatusRemove,
  type ProcessingUpdateStatusUpdate,
} from "./ProcessingUpdate";

export type PreprocessorUpdate =
  | ProcessingUpdateStatusCreate
  | ProcessingUpdateStatusUpdate
  | ProcessingUpdateStatusRemove
  | ProcessingUpdateCitationBlockCreate
  | ProcessingUpdateDebugInfoBlockCreate;

export const preprocessorUpdateSchema = z.discriminatedUnion("type", [
  processingUpdateStatusCreateSchema,
  processingUpdateStatusUpdateSchema,
  processingUpdateStatusRemoveSchema,
  processingUpdateCitationBlockCreateSchema,
  processingUpdateDebugInfoBlockCreateSchema,
]) as z.Schema<PreprocessorUpdate>;
