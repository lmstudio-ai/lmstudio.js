import { z } from "zod";

/**
 * Type representing the environment variables that can be set by the user.
 *
 * @public
 */
export const ALLOWABLE_ENV_VAR_KEYS = ["HSA_OVERRIDE_GFX_VERSION"] as const;
export type AllowableEnvVarKeys = "HSA_OVERRIDE_GFX_VERSION";
export const allowableEnvVarKeysSchema = z.enum(ALLOWABLE_ENV_VAR_KEYS);

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
