import { z } from "zod";
import {
  citationSourceSchema,
  type CitationSource,
} from "../llm/processor/PromptPreprocessorUpdate";

/**
 * @public
 */
export interface Chunk {
  content: string;
  score: number;
  citation: CitationSource;
}
export const chunkSchema = z.object({
  content: z.string(),
  score: z.number(),
  citation: citationSourceSchema,
});
