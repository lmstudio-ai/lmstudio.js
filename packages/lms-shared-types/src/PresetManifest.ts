import { z } from "zod";
import { artifactManifestBaseSchema, type ArtifactManifestBase } from "./ArtifactManifestBase.js";

/**
 * @public
 */
export interface PresetManifest extends ArtifactManifestBase {
  type: "preset";
}
export const presetManifestSchema = z.object({
  type: z.literal("preset"),
  ...artifactManifestBaseSchema.shape,
});
