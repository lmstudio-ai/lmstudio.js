import { z, type ZodSchema } from "zod";
import {
  modelInfoBaseSchema,
  modelInstanceInfoBaseSchema,
  type ModelInfoBase,
  type ModelInstanceInfoBase,
} from "../ModelInfoBase.js";

export interface LLMAdditionalInfo {
  /**
   * Whether this model is vision-enabled (i.e. supports image input).
   */
  vision: boolean;
  /**
   * Whether this model is trained natively for tool use.
   */
  trainedForToolUse: boolean;
  /**
   * Maximum context length of the model.
   */
  maxContextLength: number;
}
export const llmAdditionalInfoSchema = z.object({
  vision: z.boolean(),
  trainedForToolUse: z.boolean(),
  maxContextLength: z.number().int(),
});

export interface LLMInstanceAdditionalInfo {
  contextLength: number;
}
export const llmInstanceAdditionalInfoSchema = z.object({
  contextLength: z.number().int(),
});

export type LLMInfo = { type: "llm" } & ModelInfoBase & LLMAdditionalInfo;
export const llmInfoSchema = z
  .object({
    type: z.literal("llm"),
  })
  .extend(modelInfoBaseSchema.shape)
  .extend(llmAdditionalInfoSchema.shape) as ZodSchema<LLMInfo>;

export type LLMInstanceInfo = { type: "llm" } & ModelInstanceInfoBase &
  LLMAdditionalInfo &
  LLMInstanceAdditionalInfo;
export const llmInstanceInfoSchema = z
  .object({
    type: z.literal("llm"),
  })
  .extend(modelInstanceInfoBaseSchema.shape)
  .extend(llmAdditionalInfoSchema.shape)
  .extend(llmInstanceAdditionalInfoSchema.shape) as ZodSchema<LLMInstanceInfo>;
