import { z, type ZodSchema } from "zod";

/**
 * Check if has a parse method. If not, output error message asking for it to be a zod schema.
 */
export const zodSchemaSchema = z.custom<ZodSchema>(value => {
  if (typeof (value as any)?.parse !== "function") {
    return false;
  }
  return true;
}, "Expected a zod schema");
