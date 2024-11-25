import { z, type ZodSchema } from "zod";
import { type ModelDomainType } from "../../ModelDomainType.js";

export interface GetModelOpts {
  /**
   * The domain type of the model. By default, the domain type is "LLM".
   */
  domain?: ModelDomainType;
  /**
   * Model tag usually denotes the purpose of the tag. For example, "judge" can be used to tag the
   * model that is for judging the result. By default, the model tag is "default".
   */
  modelTag?: string;
}
export const getModelOptsSchema = z.object({
  modelTag: z.string().optional(),
  ignoreUserConfig: z.boolean().optional(),
}) as ZodSchema<GetModelOpts>;
