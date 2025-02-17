import { z } from "zod";
import {
  type EmbeddingModelInfo,
  embeddingModelInfoSchema,
  type EmbeddingModelInstanceInfo,
} from "./embedding/EmbeddingModelInfo.js";
import {
  type LLMInfo,
  llmInfoSchema,
  type LLMInstanceInfo,
  llmInstanceInfoSchema,
} from "./llm/LLMModelInfo.js";

export type ModelInfo = LLMInfo | EmbeddingModelInfo;
export const modelInfoSchema = z.discriminatedUnion("type", [
  llmInfoSchema as any,
  embeddingModelInfoSchema as any,
]) as z.ZodSchema<ModelInfo>;

export type ModelInstanceInfo = LLMInstanceInfo | EmbeddingModelInstanceInfo;
export const modelInstanceInfoSchema = z.discriminatedUnion("type", [
  llmInstanceInfoSchema as any,
  embeddingModelInfoSchema as any,
]) as z.ZodSchema<ModelInstanceInfo>;
