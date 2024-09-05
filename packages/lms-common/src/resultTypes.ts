import {
  fromSerializedError,
  serializeError,
  serializedLMSExtendedErrorSchema,
  type SerializedLMSExtendedError,
} from "@lmstudio/lms-shared-types";
import { z, type ZodType } from "zod";

export const maybeErroredSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: serializedLMSExtendedErrorSchema,
  }),
]);
export type MaybeErrored = z.infer<typeof maybeErroredSchema>;
export function promiseToMaybeErrored<T>(promise: Promise<T>): Promise<MaybeErrored> {
  return promise.then(
    () => ({ success: true }),
    error => ({ success: false, error: serializeError(error) }),
  );
}
export async function unwrapPromiseOfMaybeErrored(promise: Promise<MaybeErrored>): Promise<void> {
  const result = await promise;
  if (result.success) {
    return Promise.resolve();
  } else {
    return Promise.reject(fromSerializedError(result.error));
  }
}

export function createResultSchema<T extends ZodType>(schema: T) {
  return z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      result: schema,
    }),
    z.object({
      success: z.literal(false),
      error: serializedLMSExtendedErrorSchema,
    }),
  ]);
}
export type Result<T> =
  | {
      success: true;
      result: T;
    }
  | {
      success: false;
      error: SerializedLMSExtendedError;
    };
export function promiseToResult<T>(promise: Promise<T>): Promise<Result<T>> {
  return promise.then(
    result => ({ success: true, result }),
    error => ({ success: false, error: serializeError(error) }),
  );
}
export async function unwrapPromiseOfResult<T>(promise: Promise<Result<T>>): Promise<T> {
  const result = await promise;
  if (result.success) {
    return result.result;
  } else {
    return Promise.reject(fromSerializedError(result.error));
  }
}
export function unwrapResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.result;
  } else {
    throw fromSerializedError(result.error);
  }
}
export function routeResultToCallbacks<T>(
  result: Result<T>,
  resolve: (result: T) => void,
  reject: (error: Error) => void,
) {
  if (result.success) {
    resolve(result.result);
  } else {
    reject(fromSerializedError(result.error));
  }
}
