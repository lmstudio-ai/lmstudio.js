import { z } from "zod";
import {
  modelInfoBaseSchema,
  modelInstanceInfoBaseSchema,
  type ModelInfoBase,
  type ModelInstanceInfoBase,
} from "../ModelInfoBase.js";

/**
 * Embedding model specific information.
 *
 * @public
 */
export interface EmbeddingModelAdditionalInfo {
  /**
   * The maximum context length supported by the model.
   */
  maxContextLength: number;
}
export const embeddingModelAdditionalInfoSchema = z.object({
  maxContextLength: z.number().int(),
});

/**
 * Additional information of an embedding model instance.
 *
 * @public
 */
export interface EmbeddingModelInstanceAdditionalInfo {
  /**
   * The currently loaded context length.
   */
  contextLength: number;
}
export const embeddingModelInstanceAdditionalInfoSchema = z.object({
  contextLength: z.number().int(),
});

/**
 * Info of an embedding model. It is a combination of {@link ModelInfoBase} and
 * {@link EmbeddingModelAdditionalInfo}.
 *
 * @public
 */
export type EmbeddingModelInfo = { type: "embedding" } & ModelInfoBase &
  EmbeddingModelAdditionalInfo;
export const embeddingModelInfoSchema = z
  .object({
    type: z.literal("embedding"),
  })
  .extend(modelInfoBaseSchema.shape)
  .extend(embeddingModelAdditionalInfoSchema.shape) as z.ZodSchema<EmbeddingModelInfo>;

/**
 * Info of a loaded embedding model instance. It is a combination of {@link ModelInstanceInfoBase},
 * {@link EmbeddingModelAdditionalInfo} and {@link EmbeddingModelInstanceAdditionalInfo}.
 *
 * @public
 */
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
