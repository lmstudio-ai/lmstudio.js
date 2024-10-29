import { z } from "zod";

export type PluginRunnerType = "ecmascript";
export const pluginRunnerTypeSchema = z.enum(["ecmascript"]);

export interface PluginManifest {
  type: "plugin";
  runner: PluginRunnerType;
  owner: string;
  name: string;
  description: string;
}
export const pluginManifestSchema = z.object({
  type: z.literal("plugin"),
  runner: pluginRunnerTypeSchema,
  owner: z.string(),
  name: z.string(),
  description: z.string(),
});
