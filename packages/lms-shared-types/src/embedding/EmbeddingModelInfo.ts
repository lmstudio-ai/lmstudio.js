import { z } from "zod";
import {
  modelInfoBaseSchema,
  modelInstanceInfoBaseSchema,
  type ModelInfoBase,
  type ModelInstanceInfoBase,
} from "../ModelInfoBase.js";

export interface EmbeddingModelAdditionalInfo {
  // Nothing for now
}
export const embeddingModelAdditionalInfoSchema = z.object({});

export interface EmbeddingModelInstanceAdditionalInfo {
  // Nothing for now
}
export const embeddingModelInstanceAdditionalInfoSchema = z.object({});

export type EmbeddingModelInfo = { type: "embedding" } & ModelInfoBase &
  EmbeddingModelAdditionalInfo;
export const embeddingModelInfoSchema = z
  .object({
    type: z.literal("embedding"),
  })
  .extend(modelInfoBaseSchema.shape)
  .extend(embeddingModelAdditionalInfoSchema.shape) as z.ZodSchema<EmbeddingModelInfo>;

export type EmbeddingModelInstanceInfo = { type: "embedding" } & ModelInstanceInfoBase &
  EmbeddingModelAdditionalInfo &
  EmbeddingModelInstanceAdditionalInfo;
export const embeddingModelInstanceInfoSchema = z
  .object({ type: z.literal("embedding") })
  .extend(modelInstanceInfoBaseSchema.shape)
  .extend(embeddingModelAdditionalInfoSchema.shape)
  .extend(
    embeddingModelInstanceAdditionalInfoSchema.shape,
  ) as z.ZodSchema<EmbeddingModelInstanceInfo>;
