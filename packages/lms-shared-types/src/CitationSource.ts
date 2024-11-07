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
  pageNumber: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  lineNumber: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
}) as z.Schema<CitationSource>;
