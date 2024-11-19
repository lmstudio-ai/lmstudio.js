import { z } from "zod";

export const jsonSerializableSchema = z.any().transform((val, ctx) => {
  try {
    // Needs a more performant way to do this.
    return JSON.parse(JSON.stringify(val));
  } catch (e: any) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not JSON serializable: " + e.message,
    });
    return val;
  }
});
