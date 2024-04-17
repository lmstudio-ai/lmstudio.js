import { z, type ZodSchema } from "zod";

/**
 * Makes a Zod schema that filters out elements that do not match the provided schema.
 */
export function filteredArray<T>(schema: ZodSchema<T>): ZodSchema<Array<T>> {
  return z.array(z.any()).transform(val => val.filter(v => schema.safeParse(v).success));
}

/**
 * Makes a Zod schema that turns a failed parse into an `undefined`.
 */
export function failOk<T>(schema: ZodSchema<T>): ZodSchema<T | undefined> {
  return z.any().transform(val => (schema.safeParse(val).success ? val : undefined));
}
