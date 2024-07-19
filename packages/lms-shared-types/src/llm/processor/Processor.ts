import { z, type ZodSchema } from "zod";

export interface GetModelOpts {
  /**
   * Model tag usually denotes the purpose of the tag. For example, "judge" can be used to tag the
   * model that is for judging the result. By default, the model tag is "default".
   */
  modelTag?: string;
  ignoreUserConfig?: boolean;
}
export const getModelOptsSchema = z.object({
  modelTag: z.string().optional(),
  ignoreUserConfig: z.boolean().optional(),
}) as ZodSchema<GetModelOpts>;

export type ResolvedGetModelOpts = Required<GetModelOpts>;
export const resolvedGetModelOptsSchema = z.object({
  modelTag: z.string(),
  ignoreUserConfig: z.boolean(),
}) as ZodSchema<ResolvedGetModelOpts>;
