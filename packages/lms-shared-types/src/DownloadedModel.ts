import { z, type ZodSchema } from "zod";
import {
  modelCompatibilityTypeSchema,
  type ModelCompatibilityType,
} from "./ModelCompatibilityType";

/**
 * The base interface for a downloaded model.
 *
 * @public
 */
export interface DownloadedModelBase {
  /**
   * The key of the model. Use to load the model.
   */
  modelKey: string;
  /**
   * The format of the model.
   */
  format: ModelCompatibilityType;
  /**
   * Machine generated name of the model.
   */
  displayName: string;
  /**
   * The relative path of the model.
   */
  path: string;
  /**
   * The size of the model in bytes.
   */
  sizeBytes: number;
  /**
   * A string that represents that number of params in the model.
   */
  paramsString?: string;
  /**
   * The architecture of the model.
   */
  architecture?: string;
}
export const downloadedModelBase = z.object({
  modelKey: z.string(),
  format: modelCompatibilityTypeSchema,
  displayName: z.string(),
  path: z.string(),
  sizeBytes: z.number().int(),
  paramsString: z.string().optional(),
  architecture: z.string().optional(),
});

/**
 * Represents a locally downloaded LLM.
 *
 * @public
 */
export interface DownloadedLLM extends DownloadedModelBase {
  type: "llm";
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
  contextLength: number;
}
export const downloadedLLMSchema = downloadedModelBase.extend({
  type: z.literal("llm"),
  vision: z.boolean(),
  trainedForToolUse: z.boolean(),
  contextLength: z.number().int(),
});

/**
 * Represents a locally downloaded embedding model.
 */
export interface DownloadedEmbeddingModel extends DownloadedModelBase {
  type: "embedding";
}
export const downloadedEmbeddingModelSchema = downloadedModelBase.extend({
  type: z.literal("embedding"),
});

/**
 * Represents a locally downloaded image generation model. Note, image generation is not supported,
 * and this type is only left here as a stub.
 *
 * @deprecated Not supported.
 */
export interface DownloadedImageGenModel extends DownloadedModelBase {
  type: "imageGen";
}
export const downloadedImageGenModelSchema = downloadedModelBase.extend({
  type: z.literal("imageGen"),
});

/**
 * Represents a locally downloaded transcription model. Note, transcription is not supported, and
 * this type is only left here as a stub.
 *
 * @deprecated Not supported.
 */
export interface DownloadedTranscriptionModel extends DownloadedModelBase {
  type: "transcription";
}
export const downloadedTranscriptionModelSchema = downloadedModelBase.extend({
  type: z.literal("transcription"),
});

/**
 * Represents a locally downloaded TTS model. Note, TTS is not supported, and this type is only left
 * here as a stub.
 *
 * @deprecated Not supported.
 */
export interface DownloadedTTSModel extends DownloadedModelBase {
  type: "tts";
}
export const downloadedTTSModelSchema = downloadedModelBase.extend({
  type: z.literal("tts"),
});

/**
 * Represents a model that exists locally and can be loaded. You can use the `.type` field to
 * determine the type of the model.
 *
 * @public
 */
export type DownloadedModel = DownloadedLLM | DownloadedEmbeddingModel;
// | DownloadedImageGenModel
// | DownloadedTranscriptionModel
// | DownloadedTTSModel;
export const downloadedModelSchema = z.discriminatedUnion("type", [
  downloadedLLMSchema,
  downloadedEmbeddingModelSchema,
  // downloadedImageGenModelSchema,
  // downloadedTranscriptionModelSchema,
  // downloadedTTSModelSchema,
]) as ZodSchema<DownloadedModel>;
