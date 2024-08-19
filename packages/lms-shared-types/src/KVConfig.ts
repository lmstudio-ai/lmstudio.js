import { z } from "zod";

/**
 * TODO: Documentation
 *
 * @public
 */
export interface KVConfigField {
  key: string;
  value?: any;
}
export const kvConfigFieldSchema = z.object({
  key: z.string(),
  value: z.any(),
});

/**
 * TODO: Documentation
 *
 * @public
 */
export interface KVConfig {
  fields: Array<KVConfigField>;
}
export const kvConfigSchema = z.object({
  fields: z.array(kvConfigFieldSchema),
});

export type KVConfigLayerName =
  // Config that is currently loaded by the model
  | "currentlyLoaded"
  // Override provided by the caller of the API
  | "apiOverride"
  // Chat specific config in chats
  | "conversationSpecific"
  // Cross-chat global config in chats
  | "conversationGlobal"
  // Override provided in the OpenAI http server
  | "httpServerRequestOverride"
  // Override to allow complete mode formatting
  | "completeModeFormatting"
  // Instance specific config (set in the server tab)
  | "instance"
  // User editable per model defaults
  | "userModelDefault"
  // Virtual model baked in configs
  | "virtualModel"
  // LM Studio provided per model defaults
  | "modelDefault";

export const kvConfigLayerNameSchema = z.enum([
  "currentlyLoaded",
  "apiOverride",
  "conversationSpecific",
  "conversationGlobal",
  "httpServerRequestOverride",
  "completeModeFormatting",
  "instance",
  "userModelDefault",
  "virtualModel",
  "modelDefault",
]);

export interface KVConfigStackLayer {
  layerName: KVConfigLayerName;
  config: KVConfig;
}
export const kvConfigStackLayerSchema = z.object({
  layerName: kvConfigLayerNameSchema,
  config: kvConfigSchema,
});

export interface KVConfigStack {
  layers: Array<KVConfigStackLayer>;
}
export const kvConfigStackSchema = z.object({
  layers: z.array(kvConfigStackLayerSchema),
});
