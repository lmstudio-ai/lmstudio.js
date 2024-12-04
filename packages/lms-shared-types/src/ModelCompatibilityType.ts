import { z } from "zod";

/**
 * @public
 */
export type ModelCompatibilityType = "gguf" | "safetensors" | "onnx" | "ggml" | "mlx_placeholder";
export const modelCompatibilityTypeSchema = z.enum([
  "gguf",
  "safetensors",
  "onnx",
  "ggml",
  "mlx_placeholder",
]);
