import { zodSchemaSchema, type LLMTool } from "@lmstudio/lms-shared-types";
import { z, type ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Shared properties of all tools.
 *
 * @public
 */
export interface ToolBase {
  name: string;
  description: string;
}
export const toolBaseSchema = z.object({
  name: z.string(),
  description: z.string(),
});

/**
 * A tool that is a function.
 *
 * @public
 */
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

/**
 * Represents a tool that can be given to an LLM with `.act`.
 *
 * @public
 */
export type Tool = FunctionTool;
export const toolSchema = z.discriminatedUnion("type", [functionToolSchema]);

/**
 * A function that can be used to create a function `Tool` given a function definition and its
 * implementation.
 *
 * @public
 */
export function tool<const TParameters extends Record<string, { parse(input: any): any }>>({
  name,
  description,
  parameters,
  implementation,
}: {
  name: string;
  description: string;
  /**
   * The parameters of the function. Must be an with values being zod schemas.
   *
   * IMPORTANT
   *
   * The type here only requires an object with a `parse` function. This is not enough! We need an
   * actual zod schema because we will need to extract the JSON schema from it.
   *
   * The reason we only have a `parse` function here (as oppose to actually requiring ZodType is due
   * to this zod bug causing TypeScript breakage, when multiple versions of zod exist.
   *
   * - https://github.com/colinhacks/zod/issues/577
   * - https://github.com/colinhacks/zod/issues/2697
   * - https://github.com/colinhacks/zod/issues/3435
   */
  parameters: TParameters;
  implementation: (params: {
    [K in keyof TParameters]: TParameters[K] extends { parse: (input: any) => infer RReturnType }
      ? RReturnType
      : never;
  }) => any | Promise<any>;
}): Tool {
  return {
    name,
    description,
    type: "function",
    parametersSchema: z.object(parameters as any),
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
