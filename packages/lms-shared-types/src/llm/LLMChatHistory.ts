import { z } from "zod";

/**
 * Represents a part of the content of a message in the history.
 *
 * @public
 */
export type LLMChatHistoryMessageContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "imageBase64";
      base64: string;
    };
export const llmChatHistoryMessageContentPartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("imageBase64"),
    base64: z.string(),
  }),
]);

/**
 * Represents the content of a message in the history.
 * @public
 */
export type LLMChatHistoryMessageContent = Array<LLMChatHistoryMessageContentPart>;
export const llmChatHistoryMessageContentSchema = z.array(llmChatHistoryMessageContentPartSchema);

/**
 * Represents a role in a specific message in the history. This is a string enum, and can only be
 * one of the following values:
 *
 * - `system`: Usually used for system prompts
 * - `user`: Used for user inputs / queries
 * - `assistant`: Used for assistant responses, usually generated AI, but can also be fed by a human
 *
 * @public
 */
export type LLMChatHistoryRole = string; // "system" | "user" | "assistant";
export const llmChatHistoryRoleSchema = z
  .string()
  .refine(v => ["system", "user", "assistant"].includes(v), {
    message: "Invalid role, must be one of 'system', 'user', or 'assistant'",
  });

/**
 * Represents a single message in the history.
 *
 * @public
 */
export interface LLMChatHistoryMessage {
  role: LLMChatHistoryRole;
  content: LLMChatHistoryMessageContent;
}
export const llmChatHistoryMessageSchema = z.object({
  role: llmChatHistoryRoleSchema,
  content: llmChatHistoryMessageContentSchema,
});

/**
 * Represents the history of a conversation, which is represented as an array of messages.
 *
 * @public
 */
export type LLMChatHistory = Array<LLMChatHistoryMessage>;
export const llmChatHistorySchema = z.array(llmChatHistoryMessageSchema);

/**
 * Represents a raw context object that can be fed into the model.
 *
 * @public
 */
export interface LLMContext {
  history: LLMChatHistory;
}
export const llmContextSchema = z.object({
  history: llmChatHistorySchema,
});

/**
 * Represents the input context for a conversation request. This is an array of objects, where each
 * object represents a single message in the conversation.
 *
 * @deprecated Usage of this type is deprecated. Will soon be replaced with a superset of this type.
 *
 * @public
 */
export type LLMConversationContextInput = Array<{
  role: LLMChatHistoryRole;
  content: string;
}>;
export const llmConversationContextInputSchema = z.array(
  z.object({
    role: llmChatHistoryRoleSchema,
    content: z.string(),
  }),
);

/**
 * Represents the input context for a completion request. This is a string that represents the
 * entire conversation history.
 *
 * @public
 */
export type LLMCompletionContextInput = string;
export const llmCompletionContextInputSchema = z.string();
