import { z } from "zod";

/**
 * @public
 */
export type ModelCompatibilityType = "gguf" | "safetensors" | "onnx" | "ggml";
export const modelCompatibilityTypeSchema = z.enum(["gguf", "safetensors", "onnx", "ggml"]);
