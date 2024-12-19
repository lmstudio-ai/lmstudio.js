import { z } from "zod";

export interface InternalRetrievalResultEntry {
  content: string;
  score: number;
  sourceIndex: number;
  pageNumber?: number | [start: number, end: number];
  lineNumber?: number | [start: number, end: number];
}
export const internalRetrievalResultEntrySchema = z.object({
  content: z.string(),
  score: z.number(),
  sourceIndex: z.number().int(),
  pageNumber: z.union([z.number().int(), z.tuple([z.number().int(), z.number().int()])]).optional(),
  lineNumber: z.union([z.number().int(), z.tuple([z.number().int(), z.number().int()])]).optional(),
});

/**
 * Retrieval result used internally in transport. Most notably, only the index of the file is being
 * passed back.
 */
export interface InternalRetrievalResult {
  entries: Array<InternalRetrievalResultEntry>;
}
export const internalRetrievalResultSchema = z.object({
  entries: z.array(internalRetrievalResultEntrySchema),
});
