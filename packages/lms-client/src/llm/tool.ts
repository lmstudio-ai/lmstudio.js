import { zodSchemaSchema, type LLMTool } from "@lmstudio/lms-shared-types";
import { z, type ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export interface ToolBase {
  name: string;
  description: string;
}
export const toolBaseSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export interface FunctionTool extends ToolBase {
  type: "function";
  parametersSchema: ZodSchema;
  implementation: (params: Record<string, unknown>) => any | Promise<any>;
}
export const functionToolSchema = toolBaseSchema.extend({
  type: z.literal("function"),
  parametersSchema: zodSchemaSchema,
  implementation: z.function(),
});

export type Tool = FunctionTool;
export const toolSchema = z.discriminatedUnion("type", [functionToolSchema]);

export function tool<const TParameters extends Record<string, ZodSchema>>({
  name,
  description,
  parameters,
  implementation,
}: {
  name: string;
  description: string;
  parameters: TParameters;
  implementation: (params: { [K in keyof TParameters]: z.infer<TParameters[K]> }) =>
    | any
    | Promise<any>;
}): Tool {
  return {
    name,
    description,
    type: "function",
    parametersSchema: z.object(parameters),
    implementation: implementation as any, // Erase types
  };
}

function functionToolToLLMTool(tool: Tool): LLMTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parametersSchema) as any,
    },
  };
}

/**
 * Convert a `Tool` to a internal `LLMTool`.
 */
export function toolToLLMTool(tool: Tool): LLMTool {
  const type = tool.type;
  switch (type) {
    case "function":
      return functionToolToLLMTool(tool);
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled type: ${exhaustiveCheck}`);
    }
  }
}
