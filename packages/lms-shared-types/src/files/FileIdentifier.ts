import { z } from "zod";

export type FileNamespace = "local" | "base64";
export const fileNamespaceSchema = z.enum(["local", "base64"]);

export type ParsedFileIdentifier =
  | {
      type: "local";
      fileName: string;
    }
  | {
      type: "base64";
      base64Data: string;
    };
export const parsedFileIdentifierSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("local"),
    fileName: z.string(),
  }),
  z.object({
    type: z.literal("base64"),
    base64Data: z.string(),
  }),
]);
