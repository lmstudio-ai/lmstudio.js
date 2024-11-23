import { z } from "zod";

/**
 * @public
 */
export type PluginRunnerType = "ecmascript";
export const pluginRunnerTypeSchema = z.enum(["ecmascript"]);

export const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const kebabCaseSchema = z.string().regex(kebabCaseRegex);

/**
 * @public
 */
export interface PluginManifest {
  type: "plugin";
  runner: PluginRunnerType;
  owner: string;
  name: string;
  description: string;
  revision?: number;
}
export const pluginManifestSchema = z.object({
  type: z.literal("plugin"),
  runner: pluginRunnerTypeSchema,
  owner: kebabCaseSchema,
  name: kebabCaseSchema,
  description: z.string(),
  revision: z.number().optional(),
});
