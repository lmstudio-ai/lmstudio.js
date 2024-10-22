import { z } from "zod";

export interface PluginManifest {
  type: "plugin";
  runner: "ecmascript";
  owner: string;
  name: string;
  description: string;
}
export const pluginManifestSchema = z.object({
  type: z.literal("plugin"),
  runner: z.literal("ecmascript"),
  owner: z.string(),
  name: z.string(),
  description: z.string(),
});
