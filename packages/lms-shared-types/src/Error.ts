import { z, type ZodSchema } from "zod";
import { genericErrorDisplayDataSchema } from "./GenericErrorDisplayData";
import { llmErrorDisplayDataSchema } from "./llm/LLMErrorDisplayData";

export const errorDisplayDataSchema = z.discriminatedUnion("code", [
  ...llmErrorDisplayDataSchema,
  ...genericErrorDisplayDataSchema,
]);

export type ErrorDisplayData = z.infer<typeof errorDisplayDataSchema>;

/**
 * Makes a Zod schema that turns a failed parse into an `undefined`.
 */
function failOk<T>(schema: ZodSchema<T>): ZodSchema<T | undefined> {
  return z.any().transform(val => (schema.safeParse(val).success ? val : undefined));
}

export const serializedLMSExtendedErrorSchema = z.object({
  title: z.string(),
  cause: z.string().optional(),
  suggestion: z.string().optional(),
  errorData: z.record(z.string(), z.unknown()).optional(),
  displayData: failOk(errorDisplayDataSchema).optional(),
});
export type SerializedLMSExtendedError = z.infer<typeof serializedLMSExtendedErrorSchema>;
export function serializeError(error: any): SerializedLMSExtendedError {
  if (typeof error === "object") {
    return {
      title: error.title ?? error.message ?? "Unknown error",
      cause: error.cause,
      suggestion: error.suggestion,
      errorData: error.errorData,
      displayData: error.displayData,
    };
  } else {
    return {
      title: String(error),
    };
  }
}

/**
 * Attaches the additional error data from a serialized error to an error object.
 */
export function attachSerializedErrorData(
  error: Error,
  serialized: SerializedLMSExtendedError,
): void {
  const untypedError = error as any;
  if (serialized.cause !== undefined) {
    untypedError.cause = serialized.cause;
  }
  if (serialized.suggestion !== undefined) {
    untypedError.suggestion = serialized.suggestion;
  }
  if (serialized.errorData !== undefined) {
    untypedError.errorData = serialized.errorData;
  }
}
export function fromSerializedError(error: SerializedLMSExtendedError): Error {
  const result = new Error(error.title) as any;
  result.name = "LMStudioError";
  attachSerializedErrorData(result, error);
  return result;
}
