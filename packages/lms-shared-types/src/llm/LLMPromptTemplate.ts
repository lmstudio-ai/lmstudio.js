import { z } from "zod";

/**
 * @public
 */
export interface LLMManualPromptTemplate {
  /**
   * String to be prepended to the system prompt.
   */
  beforeSystem: string;
  /**
   * String to be appended to the system prompt.
   */
  afterSystem: string;
  /**
   * String to be prepended to a user message.
   */
  beforeUser: string;
  /**
   * String to be appended to a user message.
   */
  afterUser: string;
  /**
   * String to be prepended to an assistant message.
   */
  beforeAssistant: string;
  /**
   * String to be appended to an assistant message.
   */
  afterAssistant: string;
}
export const llmManualPromptTemplateSchema = z.object({
  beforeSystem: z.string(),
  afterSystem: z.string(),
  beforeUser: z.string(),
  afterUser: z.string(),
  beforeAssistant: z.string(),
  afterAssistant: z.string(),
});

/**
 * This type contains a unique literal for each known input format for Jinja template rendering.
 * ChatHistoryData will be converted to this format before being passed to the Jinja template.
 *
 * See below for examples of each format.
 *
 * ### promptOnly
 * Prompt in `content` field, no mention of images
 * ```typescript
 * { "messages": [{ role: "user", content: "What is this?" }] }
 * ```
 *
 * ### promptWithImages
 * Prompt in 'content' field, with 1-n images embedded at the start as `<image>` strings
 * ```typescript
 * { "messages": [{ role: "user", content: "<image>What is this?"}] }
 * ```
 *
 * ### promptWithImagesNewline
 * Prompt in 'content' field, with 1-n images embedded at the start as `<image>\n` strings
 * ```typescript
 * { "messages": [{ role: "user", content: "<image>\nWhat is this?"}] }
 * ```
 *
 * ### promptWithNumberedImages1
 * Prompt in 'content' field, with 1-n numbered images embedded at the start as `<image_*>` strings
 * ```typescript
 * { "messages": [{ role: "user", content: "<image_1><image_2>What is this?"}] }
 * ```
 *
 * ### promptWithNumberedImages2
 * Prompt in 'content' field, with 1-n numbered images embedded at the start as `[img-*]` strings
 * ```typescript
 * { "messages": [{ role: "user", content: "[img-1][img-2]What is this?"}] }
 * ```
 *
 * ### messageListWithImageType1
 * 'content' field contains a list of message parts, where each part is of type "image" or "text".
 * "text" parts contain text in the `text` field.
 * ```typescript
 * {
 *   "messages": [{
 *     role: "user",
 *     content: [{ type: "image" }{ type: "text", text: "What is this?"}]
 *   }]
 * }
 * ```
 *
 * ### messageListWithImageType2
 * 'content' field contains a list of message parts, where each part is of type "image" or "text".
 * "text" parts contain text in the `content` field.
 * ```typescript
 * {
 *   "messages": [{
 *     role: "user",
 *     content: [{ type: "image" }{ type: "text", content: "What is this?"}]
 *   }]
 * }
 * ```
 *
 * ### llamaCustomTools
 * Llama tool-use format. No images. The "assistant" can make requests to tool calls. The "tool"
 * role contains the results of the tool calls. The "custom_tools" field is used to define the tools
 * that the model can request.
 * ```typescript
 * {
 *   messages: [
 *     { role: "user", content: "What's the delivery date for order 123" },
 *     { role: "assistant", content: "Let me check your delivery date.",
 *       tool_calls: [{
 *         type: "function",
 *         function: { name: "get_delivery_date", arguments: "{\"order_id\":\"123\"}" }
 *       }]
 *     },
 *     { role: "tool", content: '{"order_id": "123", "delivery_date": "March 1st, 2024"}' }
 *   ],
 *   custom_tools: [{
 *     type: "function",
 *     function: {
 *       name: "get_delivery_date",
 *       description: "Get the delivery date for a customer's order",
 *       parameters: {
 *         type: "object",
 *         properties: {
 *           order_id: {
 *             type: "string",
 *             description: "The customer's order ID."
 *           }
 *         },
 *         required: ["order_id"],
 *         additionalProperties: false
 *       }
 *     }
 *   }]
 * }
 * ```
 *
 * ### mistralTools
 * Mistral tool-use format. Similar to llamaCustomTools but with additional validation rules, and
 * tools are passed through the "tools" field instead of the "custom_tools" field.
 * IDs must be present in both "tool_calls" from "assistant" and in "tool_call_id" when a message
 * is sent from the "tool" role. IDs must be 9 alphanumeric characters long.
 * ```typescript
 * {
 *   messages: [
 *     { role: "user", content: "What's the delivery date for order 123?" },
 *     { role: "assistant", tool_calls: [{
 *         id: "123456789",
 *         function: {
 *           name: "get_delivery_date",
 *           arguments: "{\"order_id\":\"123\"}"
 *         }
 *     }]},
 *     { role: "tool",
 *       tool_call_id: "123456789",
 *       content: '{"order_id": "123", "delivery_date": "March 1st, 2024"}'
 *     }
 *   ],
 *   tools: [<tool jsons here>]
 * }
 * ```
 *
 * ### qwenTools
 * The same as `llamaCustomTools`, but the "tools" field is used to define the tools
 * that the model can request (instead of "custom_tools" for `llamaCustomTools`).
 * ```typescript
 * {
 *   messages: [
 *     { role: "user", content: "What's the delivery date for order 123" },
 *     { role: "assistant", content: "Let me check your delivery date.",
 *       tool_calls: [{
 *         type: "function",
 *         function: { name: "get_delivery_date", arguments: "{\"order_id\":\"123\"}" }
 *       }]
 *     },
 *     { role: "tool", content: '{"order_id": "123", "delivery_date": "March 1st, 2024"}' }
 *   ],
 *   tools: [<tool jsons here>]
 * }
 * ```
 *
 * @public
 */
export type LLMJinjaInputFormat =
  | "promptOnly"
  | "promptWithImages"
  | "promptWithImagesNewline"
  | "promptWithNumberedImages1"
  | "promptWithNumberedImages2"
  | "messageListWithImageType1"
  | "messageListWithImageType2"
  | "llamaCustomTools"
  | "mistralTools"
  | "qwenTools";
export const llmJinjaInputFormatSchema = z.enum([
  "promptOnly",
  "promptWithImages",
  "promptWithImagesNewline",
  "promptWithNumberedImages1",
  "promptWithNumberedImages2",
  "messageListWithImageType1",
  "messageListWithImageType2",
  "llamaCustomTools",
  "mistralTools",
  "qwenTools",
]);

// TODO(matt): documentation

/**
 * @public
 */
export type LLMJinjaInputMessagesContentImagesConfig =
  | { type: "simple"; value: string }
  | { type: "numbered"; prefix: string; suffix: string }
  | { type: "object" };
export const llmJinjaInputMessagesContentImagesConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("simple"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("numbered"),
    prefix: z.string(),
    suffix: z.string(),
  }),
  z.object({
    type: z.literal("object"),
  }),
]);

/**
 * @public
 */
export type LLMJinjaInputMessagesContentConfig =
  | {
      type: "string";
      imagesConfig?: LLMJinjaInputMessagesContentImagesConfig;
    }
  | {
      type: "array";
      textFieldName: "content" | "text";
      imagesConfig?: LLMJinjaInputMessagesContentImagesConfig;
    };
export const llmJinjaInputMessagesContentConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("string"),
    imagesConfig: llmJinjaInputMessagesContentImagesConfigSchema.optional(),
  }),
  z.object({
    type: z.literal("array"),
    textFieldName: z.enum(["content", "text"]),
    imagesConfig: llmJinjaInputMessagesContentImagesConfigSchema.optional(),
  }),
]);

/**
 * @public
 */
export interface LLMJinjaInputMessagesConfig {
  contentConfig: LLMJinjaInputMessagesContentConfig;
}
export const llmJinjaInputMessagesConfigSchema = z.object({
  contentConfig: llmJinjaInputMessagesContentConfigSchema,
});

/**
 * @public
 */
export interface LLMJinjaInputToolsConfig {
  fieldName: string;
}
export const llmJinjaInputToolsConfigSchema = z.object({
  fieldName: z.string(),
});

/**
 *
 * Configures how ChatHistoryData should be input to jinja for prompt rendering.
 *
 * @public
 */
export interface LLMJinjaInputConfig {
  messagesConfig: LLMJinjaInputMessagesConfig;
  toolsConfig?: LLMJinjaInputToolsConfig;
}
export const llmJinjaInputConfigSchema = z.object({
  messagesConfig: llmJinjaInputMessagesConfigSchema,
  toolsConfig: llmJinjaInputToolsConfigSchema.optional(),
});

/**
 * @public
 */
export interface LLMJinjaPromptTemplate {
  template: string;
  /**
   * Required for applying Jinja template.
   */
  bosToken: string;
  /**
   * Required for applying Jinja template.
   */
  eosToken: string;
  /**
   * Format of the input to the Jinja template.
   *
   * DEPRECATED
   */
  inputFormat?: LLMJinjaInputFormat;
  /**
   * Config for how ChatHistoryData should be input to jinja for prompt rendering.
   */
  inputConfig?: LLMJinjaInputConfig;
}
export const llmJinjaPromptTemplateSchema = z.object({
  template: z.string(),
  bosToken: z.string(),
  eosToken: z.string(),
  inputFormat: llmJinjaInputFormatSchema.optional(),
  inputConfig: llmJinjaInputConfigSchema.optional(),
});

/** @public */
export type LLMPromptTemplateType = "manual" | "jinja";
export const llmPromptTemplateTypeSchema = z.enum(["manual", "jinja"]);

/**
 * @public
 */
export interface LLMPromptTemplate {
  type: LLMPromptTemplateType;
  manualPromptTemplate?: LLMManualPromptTemplate;
  jinjaPromptTemplate?: LLMJinjaPromptTemplate;
  /**
   * Additional stop strings to be used with this template.
   */
  stopStrings: Array<string>;
}
export const llmPromptTemplateSchema = z.object({
  type: llmPromptTemplateTypeSchema,
  manualPromptTemplate: llmManualPromptTemplateSchema.optional(),
  jinjaPromptTemplate: llmJinjaPromptTemplateSchema.optional(),
  stopStrings: z.array(z.string()),
});
