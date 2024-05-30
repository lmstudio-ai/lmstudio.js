import { z } from "zod";

export type ModelDomainType = "llm" | "embedding";
export const modelDomainTypeSchema = z.enum(["llm", "embedding"]);
