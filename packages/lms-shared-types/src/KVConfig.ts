import { z } from "zod";

export interface KVConfigField {
  key: string;
  value?: any;
}
export const kvConfigFieldSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export interface KVConfig {
  fields: Array<KVConfigField>;
}
export const kvConfigSchema = z.object({
  fields: z.array(kvConfigFieldSchema),
});

export interface KVConfigStackLayer {
  layerName: string;
  config: KVConfig;
}
export const kvConfigStackLayerSchema = z.object({
  layerName: z.string(),
  config: kvConfigSchema,
});

export interface KVConfigStack {
  layers: Array<KVConfigStackLayer>;
}
export const kvConfigStackSchema = z.object({
  layers: z.array(kvConfigStackLayerSchema),
});
