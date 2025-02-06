import { z } from "zod";

/**
 * @public
 */
export type ModelCompatibilityType =
  | "gguf"
  | "safetensors"
  | "onnx"
  | "ggml"
  | "mlx_placeholder"
  | "pt_safetensors";
export const modelCompatibilityTypeSchema = z.enum([
  "gguf",
  "safetensors",
  "onnx",
  "ggml",
  "mlx_placeholder",
  "pt_safetensors",
]);
