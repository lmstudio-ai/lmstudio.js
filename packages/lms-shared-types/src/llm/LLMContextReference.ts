import { z } from "zod";

/**
 * Represents a reference to a LLM context that can be loaded into a context.
 */
export type LLMContextReference =
  | {
      type: "jsonFile";
      absPath: string;
    }
  | {
      type: "yamlFile";
      absPath: string;
    };
export const llmContextReferenceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("jsonFile"),
    absPath: z.string(),
  }),
  z.object({
    type: z.literal("yamlFile"),
    absPath: z.string(),
  }),
]);

export type LLMContextReferenceJsonFile = Array<{
  role: "user" | "assistant" | "system";
  content: string;
}>;
export const llmContextReferenceJsonFileSchema = z.array(
  z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  }),
);

export type LLMContextReferenceYamlFile = Array<
  | {
      system: string;
    }
  | {
      user: string;
    }
  | {
      assistant: string;
    }
>;
export const llmContextReferenceYamlFileSchema = z.array(
  z.union([
    z.object({
      system: z.string(),
    }),
    z.object({
      user: z.string(),
    }),
    z.object({
      assistant: z.string(),
    }),
  ]),
);
