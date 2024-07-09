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
  title: failOk(z.string()).default("Unknown error"),
  cause: failOk(z.string()).optional(),
  suggestion: failOk(z.string()).optional(),
  errorData: failOk(z.record(z.string(), z.unknown())).optional(),
  displayData: failOk(errorDisplayDataSchema).optional(),
  stack: failOk(z.string()).optional(),
});
export type SerializedLMSExtendedError = z.infer<typeof serializedLMSExtendedErrorSchema>;
export function serializeError(error: any): SerializedLMSExtendedError {
  if (typeof error === "object") {
    return serializedLMSExtendedErrorSchema.parse({
      title: error.title ?? error.message ?? "Unknown error",
      cause: error.cause,
      suggestion: error.suggestion,
      errorData: error.errorData,
      displayData: error.displayData,
      stack: error.stack,
    });
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
  if (serialized.displayData !== undefined) {
    untypedError.displayData = serialized.displayData;
  }
  if (serialized.stack !== undefined) {
    untypedError.stack += "\n Caused By: " + serialized.stack;
  }
}
export function fromSerializedError(error: SerializedLMSExtendedError): Error {
  const result = new Error(error.title) as any;
  result.name = "LMStudioError";
  attachSerializedErrorData(result, error);
  return result;
}
