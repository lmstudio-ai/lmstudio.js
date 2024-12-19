import { z } from "zod";

/**
 * Represents a source of a citation.
 *
 * @public
 */
export interface CitationSource {
  fileName: string;
  absoluteFilePath?: string;
  pageNumber?: number | [start: number, end: number];
  lineNumber?: number | [start: number, end: number];
}
export const citationSourceSchema = z.object({
  fileName: z.string(),
  absoluteFilePath: z.string().optional(),
  pageNumber: z.union([z.number().int(), z.tuple([z.number().int(), z.number().int()])]).optional(),
  lineNumber: z.union([z.number().int(), z.tuple([z.number().int(), z.number().int()])]).optional(),
}) as z.Schema<CitationSource>;
