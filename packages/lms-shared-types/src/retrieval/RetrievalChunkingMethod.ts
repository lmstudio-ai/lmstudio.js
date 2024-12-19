import { z } from "zod";

/**
 * @public
 */
export type RetrievalChunkingMethod = {
  type: "recursive-v1";
  chunkSize: number;
  chunkOverlap: number;
};
export const retrievalChunkingMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("recursive-v1"),
    chunkSize: z.number().int(),
    chunkOverlap: z.number().int(),
  }),
]);

export type RetrievalChunkingMethodIdentifier = `recursive-v1(${number},${number})`;

export function serializeRetrievalChunkingMethod(
  chunkingMethod: RetrievalChunkingMethod,
): RetrievalChunkingMethodIdentifier {
  switch (chunkingMethod.type) {
    case "recursive-v1":
      return `recursive-v1(${chunkingMethod.chunkSize},${chunkingMethod.chunkOverlap})`;
    default: {
      const exhaustiveCheck: never = chunkingMethod.type;
      throw new Error(`Unknown chunking method type: ${exhaustiveCheck}.`);
    }
  }
}
