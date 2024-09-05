import { z } from "zod";
import {
  ProcessingUpdateCitationBlockCreateSchema,
  ProcessingUpdateDebugInfoBlockCreateSchema,
  ProcessingUpdateStatusCreateSchema,
  ProcessingUpdateStatusRemoveSchema,
  ProcessingUpdateStatusUpdateSchema,
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
  ProcessingUpdateStatusCreateSchema,
  ProcessingUpdateStatusUpdateSchema,
  ProcessingUpdateStatusRemoveSchema,
  ProcessingUpdateCitationBlockCreateSchema,
  ProcessingUpdateDebugInfoBlockCreateSchema,
]) as z.Schema<PreprocessorUpdate>;
