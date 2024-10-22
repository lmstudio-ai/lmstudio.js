import { z } from "zod";
import { type GeneratorController } from "./ProcessingController";

/**
 * TODO: Documentation
 *
 * @public
 */
export type Generator = (ctl: GeneratorController) => Promise<void>;
export const generatorSchema = z.function();

/**
 * TODO: Documentation
 *
 * @public
 */
export interface GeneratorRegistration {
  identifier: string;
  generate: Generator;
}
export const generatorRegistrationSchema = z.object({
  identifier: z.string(),
  generate: generatorSchema,
});
