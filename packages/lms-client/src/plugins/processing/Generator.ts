import { z } from "zod";
import { type GeneratorController } from "./ProcessingController.js";

/**
 * TODO: Documentation
 *
 * @public
 */
export type Generator = (ctl: GeneratorController) => Promise<void>;
export const generatorSchema = z.function();
