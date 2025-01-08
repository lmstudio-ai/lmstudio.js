import { z } from "zod";

/**
 * @public
 */
export const allowableKeys = [
  "HSA_OVERRIDE_GFX_VERSION",
  // ... add more allowed keys here
] as const;
/**
 * Allow-list only record of environment variables that can be set by the user.
 *
 * @public
 */
export type AllowableEnvVars = Partial<Record<(typeof allowableKeys)[number], string>>;
export const allowableEnvVarsSchema = z.record(
  z.enum(allowableKeys),
  z.string(),
) as z.ZodSchema<AllowableEnvVars>;
