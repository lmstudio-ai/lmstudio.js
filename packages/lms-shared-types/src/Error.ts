import { z } from "zod";

export const serializedLMSExtendedErrorSchema = z.object({
  title: z.string(),
  cause: z.string().optional(),
  suggestion: z.string().optional(),
  errorData: z.record(z.string(), z.unknown()).optional(),
});
export type SerializedLMSExtendedError = z.infer<typeof serializedLMSExtendedErrorSchema>;
export function serializeError(error: any): SerializedLMSExtendedError {
  if (typeof error === "object") {
    return {
      title: error.title ?? error.message ?? "Unknown error",
      cause: error.cause,
      suggestion: error.suggestion,
      errorData: error.errorData,
    };
  } else {
    return {
      title: String(error),
    };
  }
}
export function fromSerializedError(error: SerializedLMSExtendedError): Error {
  const result = new Error(error.title) as any;
  result.name = "LMStudioError";
  result.cause = error.cause;
  result.suggestion = error.suggestion;
  result.errorData = error.errorData;
  return result;
}
