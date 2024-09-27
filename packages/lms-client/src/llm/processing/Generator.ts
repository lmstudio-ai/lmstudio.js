import { z } from "zod";
import { type GeneratorController } from "./ProcessingController";

/**
 * TODO: Documentation
 *
 * @public
 */
export interface Generator {
  readonly identifier: string;
  generate(ctl: GeneratorController): Promise<void>;
}
export const generatorSchema = z.object({
  identifier: z.string(),
  generate: z.function(),
});
