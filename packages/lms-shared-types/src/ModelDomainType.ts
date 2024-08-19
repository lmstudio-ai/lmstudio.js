import { z } from "zod";

/**
 * @public
 */
export type ModelDomainType = "llm" | "embedding";
export const modelDomainTypeSchema = z.enum(["llm", "embedding"]);
