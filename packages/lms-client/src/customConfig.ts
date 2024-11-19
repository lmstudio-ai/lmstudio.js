import {
  type GlobalKVFieldValueTypeLibraryMap,
  kvValueTypesLibrary,
} from "@lmstudio/lms-kv-config";
import { KVConfigSchematicsBuilder } from "@lmstudio/lms-kv-config/dist/KVConfig";

/**
 * @public
 */
export type VirtualConfigSchematics = {
  [key: string]: {
    key: string;
    type: any;
    valueTypeKey: string;
  };
};

export const configSchematicsBrand = Symbol("ConfigSchematics");
/**
 * @public
 */
export interface ConfigSchematics<TVirtualConfigSchematics extends VirtualConfigSchematics> {
  [configSchematicsBrand]?: TVirtualConfigSchematics;
}

export const parsedConfigBrand = Symbol("ConfigSchematics");
/**
 * @public
 */
export interface ParsedConfig<TVirtualConfigSchematics extends VirtualConfigSchematics> {
  [configSchematicsBrand]?: TVirtualConfigSchematics;
  get<TKey extends keyof TVirtualConfigSchematics & string>(
    key: TKey,
  ): TVirtualConfigSchematics[TKey]["type"];
}

export const configSchematicsBuilderBrand = Symbol("ConfigSchematicsBuilder");
/**
 * The opaque type for KVConfigSchematicsBuilder that is exposed in lmstudio.js SDK. Notably, this
 * has significantly simplified types and is easier to use.
 *
 * @public
 */
export interface ConfigSchematicsBuilder<TVirtualConfigSchematics extends VirtualConfigSchematics> {
  [configSchematicsBuilderBrand]?: TVirtualConfigSchematics;
  /**
   * Adds a field to the config schematics.
   */
  field<TKey extends string, TValueTypeKey extends keyof GlobalKVFieldValueTypeLibraryMap & string>(
    key: TKey,
    valueTypeKey: TValueTypeKey,
    valueTypeParams: GlobalKVFieldValueTypeLibraryMap[TValueTypeKey]["param"],
    defaultValue: GlobalKVFieldValueTypeLibraryMap[TValueTypeKey]["value"],
  ): ConfigSchematicsBuilder<
    TVirtualConfigSchematics & {
      [key in TKey]: {
        key: TKey;
        type: GlobalKVFieldValueTypeLibraryMap[TValueTypeKey]["value"];
        valueTypeKey: TValueTypeKey;
      };
    }
  >;
  /**
   * Adds a "scope" to the config schematics. This is useful for grouping fields together.
   */
  scope<TScopeKey extends string, TInnerVirtualConfigSchematics extends VirtualConfigSchematics>(
    scopeKey: TScopeKey,
    fn: (
      builder: ConfigSchematicsBuilder<{}>,
    ) => ConfigSchematicsBuilder<TInnerVirtualConfigSchematics>,
  ): ConfigSchematicsBuilder<
    TVirtualConfigSchematics & {
      [InnerKey in keyof TInnerVirtualConfigSchematics &
        string as `${TScopeKey}.${InnerKey}`]: TInnerVirtualConfigSchematics[InnerKey];
    }
  >;
  build(): ConfigSchematics<TVirtualConfigSchematics>;
}

/**
 * @public
 */
export function createConfigSchematics(): ConfigSchematicsBuilder<{}> {
  return new KVConfigSchematicsBuilder(kvValueTypesLibrary) as ConfigSchematicsBuilder<{}>;
}
