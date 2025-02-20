import { z } from "zod";

export const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const kebabCaseSchema = z.string().regex(kebabCaseRegex);

/**
 * Base type for the manifest of an artifact.
 *
 * @public
 */
export interface ArtifactManifestBase {
  owner: string;
  name: string;
  description: string;
  revision?: number;
}
export const artifactManifestBaseSchema = z.object({
  owner: kebabCaseSchema,
  name: kebabCaseSchema,
  description: z.string(),
  revision: z.number().int().optional(),
});
