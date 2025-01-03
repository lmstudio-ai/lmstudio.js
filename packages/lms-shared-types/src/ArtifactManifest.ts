import { z, type ZodSchema } from "zod";
import { pluginManifestSchema, type PluginManifest } from "./PluginManifest.js";
import { presetManifestSchema, type PresetManifest } from "./PresetManifest.js";

export type ArtifactManifest = PluginManifest | PresetManifest;
export const artifactManifestSchema = z.discriminatedUnion("type", [
  pluginManifestSchema,
  presetManifestSchema,
]) as ZodSchema<ArtifactManifest>;
