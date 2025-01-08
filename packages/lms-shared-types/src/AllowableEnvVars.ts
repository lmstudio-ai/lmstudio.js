import { z } from "zod";

/**
 * Type representing the environment variables that can be set by the user.
 *
 * @public
 */
export type AllowableEnvVarKeys = "HSA_OVERRIDE_GFX_VERSION";
export const allowableEnvVarKeysSchema = z.enum(["HSA_OVERRIDE_GFX_VERSION"]);

/**
 * Allow-list only record of environment variables and their values.
 *
 * @public
 */
export type AllowableEnvVars = Partial<Record<AllowableEnvVarKeys, string>>;
export const allowableEnvVarsSchema = z.record(
  allowableEnvVarKeysSchema,
  z.string(),
) as z.ZodSchema<AllowableEnvVars>;
