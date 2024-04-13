import { z } from "zod";

/**
 * A string that is reasonable to use as a key. For example, as preset name, model address, or model
 * identifier.
 */
export const reasonableKeyStringSchema = z
  .string()
  .min(1)
  .max(1024)
  .refine(value => value !== "__proto__", {
    message: 'For security reasons, "__proto__" is not allowed',
  })
  .refine(value => /\p{C}/u.test(value) === false, {
    message: "Control characters are not allowed",
  });
