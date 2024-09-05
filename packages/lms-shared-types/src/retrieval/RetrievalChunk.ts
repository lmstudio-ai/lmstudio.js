import { z } from "zod";
import { citationSourceSchema, type CitationSource } from "../CitationSource";

/**
 * @public
 */
export interface RetrievalChunk {
  content: string;
  score: number;
  citation: CitationSource;
}
export const retrievalChunkSchema = z.object({
  content: z.string(),
  score: z.number(),
  citation: citationSourceSchema,
});
