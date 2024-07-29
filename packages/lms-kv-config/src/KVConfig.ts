import { type KVConfig, type KVConfigStack } from "@lmstudio/lms-shared-types";
import { type Any } from "ts-toolbelt";
import { z, type ZodSchema } from "zod";

// KV Config is the idea of simply storing config as an array of key-value pairs. This file provides
// type definitions and utility classes for working with KV Configs and schemas.
//
// Overview:
//
// - `KVConfig`, the entire config (an array of key-value pairs)
// - `KVField`, a single key-value pair in `KVConfig`
// - `KVFieldValueType`, a type that the value of a KVField can be, can be supplemented with
//   additional parameters to produce more tightly defined types. For example,
//   `llm:llama:prediction:temperature` has the value type of `numeric` with the following
//   parameters: `{ min: 0, max: 1 }`.
// - `KVFieldValueTypesLibrary`, a collection of `KVFieldValueTypes`, built with a builder pattern
//   using `KVFieldValueTypesLibraryBuilder`.
// - `KVConfigSchematics`, a mapping from keys to `KVFieldValueTypes` with associated parameters and
//   default values. Built with a builder pattern using `KVConfigSchematicsBuilder`.
//
// Usage & Implementation:
//
// This file only provides the type definitions and utility classes.
//
// The value types are defined in the `valueTypes.ts` file.
//
// The schema is defined in the `schema.ts` file.

/**
 * Used internally by KVFieldValueTypesLibrary to keep track of a single field value type definition
 * with the generics.
 */
export interface KVVirtualFieldValueType {
  value: any;
  param: any;
}
/**
 * Used internally by KVFieldValueTypesLibrary to keep track of all field value type definitions
 * with the generics.
 */
type KVVirtualFieldValueTypesMapping = {
  [key: string]: KVVirtualFieldValueType;
};

/**
 * Represents a single field value type definition.
 */
interface KVConcreteFieldValueType {
  paramType: ZodSchema;
  schemaMaker: (param: any) => ZodSchema;
}
type KVConcreteFieldValueTypesMap = Map<string, KVConcreteFieldValueType>;

type ExposedZodObject<TObject extends {}> = {
  [TKey in keyof TObject]: ZodSchema<TObject[TKey]>;
};

type CanBeUndefinedKeys<TType extends {}> = {
  [TKey in keyof TType]: undefined extends TType[TKey] ? TKey : never;
}[keyof TType];

type AllowOptionalForUndefined<TType extends {}> = Any.Compute<
  {
    [TKey in CanBeUndefinedKeys<TType>]?: TType[TKey];
  } & {
    [TKey in Exclude<keyof TType, CanBeUndefinedKeys<TType>>]: TType[TKey];
  }
>;

/**
 * A builder for building a KVFieldValueTypeLibrary.
 *
 * The reason why a builder is used is to enable much better type inference when defining the value
 * types.
 */
export class KVFieldValueTypesLibraryBuilder<
  TKVFieldValueTypeBase extends {},
  TKVFieldValueTypeLibraryMap extends KVVirtualFieldValueTypesMapping = {},
> {
  private readonly valueTypes: KVConcreteFieldValueTypesMap = new Map();

  public constructor(public readonly baseSchema: ExposedZodObject<TKVFieldValueTypeBase>) {}
  /**
   * Define a new field value type.
   */
  public valueType<TKey extends string, TValueTypeParams extends {}, TValue>(
    key: TKey,
    param: {
      paramType: ExposedZodObject<TValueTypeParams>;
      schemaMaker: (param: TValueTypeParams) => ZodSchema<TValue>;
    },
  ): KVFieldValueTypesLibraryBuilder<
    TKVFieldValueTypeBase,
    TKVFieldValueTypeLibraryMap & {
      [key in TKey]: {
        value: TValue;
        param: AllowOptionalForUndefined<TValueTypeParams & TKVFieldValueTypeBase>;
      };
    }
  > {
    if (this.valueTypes.has(key)) {
      throw new Error(`ValueType with key ${key} already exists`);
    }
    this.valueTypes.set(key, {
      paramType: z.object({
        ...this.baseSchema,
        ...param.paramType,
      }),
      schemaMaker: param.schemaMaker,
    });
    return this;
  }
  public build(): KVFieldValueTypeLibrary<TKVFieldValueTypeLibraryMap> {
    return new KVFieldValueTypeLibrary(this.valueTypes);
  }
}

/**
 * Represents a library of field value types.
 */
export class KVFieldValueTypeLibrary<
  TKVFieldValueTypeLibraryMap extends KVVirtualFieldValueTypesMapping,
> {
  public constructor(private readonly valueTypes: KVConcreteFieldValueTypesMap) {}
  /**
   * Gets the schema for a specific field value type with the given key and parameters.
   */
  public getSchema<TKey extends keyof TKVFieldValueTypeLibraryMap & string>(
    key: TKey,
    param: TKVFieldValueTypeLibraryMap[TKey]["param"],
  ): ZodSchema<TKVFieldValueTypeLibraryMap[TKey]["value"]> {
    return this.valueTypes.get(key)!.schemaMaker(param);
  }
}

export type InferKVValueTypeDef<TLibrary extends KVFieldValueTypeLibrary<any>> =
  TLibrary extends KVFieldValueTypeLibrary<infer RMap extends KVVirtualFieldValueTypesMapping>
    ? {
        [TKey in keyof RMap]: {
          type: TKey;
          value: RMap[TKey]["value"];
          param: RMap[TKey]["param"];
        };
      }[keyof RMap]
    : never;

export type KVVirtualFieldSchema = {
  key: string;
  type: any;
  valueTypeKey: string;
};
type KVVirtualConfigSchema = {
  [key: string]: KVVirtualFieldSchema;
};

interface KVConcreteFieldSchema {
  valueTypeKey: string;
  valueTypeParams: any;
  schema: ZodSchema;
  defaultValue?: any;
}

type KeyPatternMatch<TSource, TPattern> = TPattern extends `${infer RParent}.*`
  ? TSource extends `${RParent}.${string}`
    ? TSource
    : never
  : TSource extends TPattern
    ? TSource
    : never;

export class KVConfigSchematicsBuilder<
  TKVFieldValueTypeLibraryMap extends KVVirtualFieldValueTypesMapping,
  TKVConfigSchema extends KVVirtualConfigSchema = {},
> {
  private readonly fields: Map<string, KVConcreteFieldSchema> = new Map();

  public constructor(
    private readonly valueTypeLibrary: KVFieldValueTypeLibrary<TKVFieldValueTypeLibraryMap>,
  ) {}

  /**
   * Adds a field
   */
  public field<
    TKey extends string,
    TValueTypeKey extends keyof TKVFieldValueTypeLibraryMap & string,
  >(
    key: TKey,
    valueTypeKey: TValueTypeKey,
    valueTypeParams: TKVFieldValueTypeLibraryMap[TValueTypeKey]["param"],
    defaultValue: TKVFieldValueTypeLibraryMap[TValueTypeKey]["value"],
  ): KVConfigSchematicsBuilder<
    TKVFieldValueTypeLibraryMap,
    TKVConfigSchema & {
      [key in TKey]: {
        key: TKey;
        type: TKVFieldValueTypeLibraryMap[TValueTypeKey]["value"];
        valueTypeKey: TValueTypeKey;
      };
    }
  > {
    const schema = this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams);
    const defaultValueParseResult = schema.safeParse(defaultValue);
    if (!defaultValueParseResult.success) {
      throw new Error(
        `Invalid default value for field ${key}: ${defaultValueParseResult.error.message}`,
      );
    }
    defaultValue = defaultValueParseResult.data;
    this.fields.set(key, {
      valueTypeKey,
      valueTypeParams,
      schema: this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams),
      defaultValue,
    });
    return this as any;
  }

  /**
   * Convenience method for grouping a set of fields under a shared namespace.
   *
   * For example, if we want to create two fields: `some:namespace:a` and `some:namespace:b`.
   * Instead of doing:
   *
   * ```ts
   * builder
   *   .field("some:namespace:a", ...)
   *   .field("some:namespace:b", ...)
   * ```
   *
   * We can do:
   *
   * ```ts
   * builder.scope("some:namespace", builder =>
   *  builder
   *   .field("a", ...)
   *   .field("b", ...)
   * )
   *
   * This method does support nesting. Whether to nest or not is up to the user.
   */
  public scope<TScopeKey extends string, TInnerConfigSchema extends KVVirtualConfigSchema>(
    scopeKey: TScopeKey,
    fn: (
      builder: KVConfigSchematicsBuilder<TKVFieldValueTypeLibraryMap, {}>,
    ) => KVConfigSchematicsBuilder<TKVFieldValueTypeLibraryMap, TInnerConfigSchema>,
  ): KVConfigSchematicsBuilder<
    TKVFieldValueTypeLibraryMap,
    TKVConfigSchema & {
      [InnerKey in keyof TInnerConfigSchema &
        string as `${TScopeKey}.${InnerKey}`]: TInnerConfigSchema[InnerKey];
    }
  > {
    const innerBuilder = fn(new KVConfigSchematicsBuilder(this.valueTypeLibrary));
    for (const [
      key,
      { valueTypeKey, valueTypeParams, schema, defaultValue },
    ] of innerBuilder.fields.entries()) {
      this.fields.set(`${scopeKey}.${key}`, {
        valueTypeKey,
        valueTypeParams,
        schema,
        defaultValue,
      });
    }
    return this as any;
  }

  public build(): KVConfigSchematics<TKVFieldValueTypeLibraryMap, TKVConfigSchema, ""> {
    return new KVConfigSchematics(this.valueTypeLibrary, this.fields, "");
  }
}

const createParsedKVConfig = Symbol("createParsedKVConfig");

export class KVConfigSchematics<
  TKVFieldValueTypeLibraryMap extends KVVirtualFieldValueTypesMapping,
  TKVConfigSchema extends KVVirtualConfigSchema,
  TBaseKey extends string,
> {
  public constructor(
    private readonly valueTypeLibrary: KVFieldValueTypeLibrary<TKVFieldValueTypeLibraryMap>,
    private readonly fields: Map<string, KVConcreteFieldSchema>,
    private readonly baseKey: TBaseKey,
  ) {}

  public getFieldsMap(): ReadonlyMap<string, KVConcreteFieldSchema> {
    return new Map([...this.fields.entries()].map(([key, field]) => [this.baseKey + key, field]));
  }

  public getSchemaForKey<TKey extends keyof TKVConfigSchema & string>(
    key: TKey,
  ): ZodSchema<TKVConfigSchema[TKey]["type"]> {
    const fullKey = this.baseKey + key;
    const field = this.fields.get(fullKey);
    if (field === undefined) {
      throw new Error(`Field with key ${fullKey} does not exist`);
    }
    return field.schema;
  }

  private parseField(fieldSchema: KVConcreteFieldSchema, key: string, value: any) {
    if (value === undefined) {
      if (fieldSchema.defaultValue === undefined) {
        throw new Error(`Field with key ${this.baseKey + key} is missing and has no default value`);
      }
      return fieldSchema.defaultValue;
    }
    const parseResult = fieldSchema.schema.safeParse(value);
    if (!parseResult.success) {
      throw new Error(
        `Field with key ${this.baseKey + key} does not satisfy the schema:` +
          parseResult.error.message,
      );
    }
    return parseResult.data;
  }

  /**
   * Parse and access a field in the config.
   */
  public access<TKey extends keyof TKVConfigSchema & string>(
    config: KVConfig,
    key: TKey,
  ): TKVConfigSchema[TKey]["type"] {
    const fullKey = this.baseKey + key;
    const fieldSchema = this.fields.get(key);
    if (fieldSchema === undefined) {
      throw new Error(`Field with key ${fullKey} does not exist`);
    }
    return this.parseField(fieldSchema, fullKey, config.fields.find(f => f.key === fullKey)?.value);
  }

  /**
   * Gets a slice of the config schema with the given key patterns. Support syntax:
   *
   * - `some.namespace.key`: Matches exactly `some.namespace.key`
   * - `some.namespace.*`: Matches anything that starts with `some.namespace.`
   */
  public sliced<TKeyPattern extends string>(
    ...patterns: TKeyPattern[]
  ): KVConfigSchematics<
    TKVFieldValueTypeLibraryMap,
    {
      [TKey in KeyPatternMatch<keyof TKVConfigSchema, TKeyPattern>]: TKVConfigSchema[TKey];
    },
    TBaseKey
  > {
    type Pattern =
      | {
          type: "exact";
          value: string;
        }
      | {
          type: "prefix";
          value: string;
        };
    const parsedPatterns: Array<Pattern> = patterns.map(p => {
      if (p.endsWith("*")) {
        return { type: "prefix", value: p.substring(0, p.length - 1) };
      }
      return { type: "exact", value: p };
    });
    const newFields = new Map<string, KVConcreteFieldSchema>();
    for (const [key, field] of this.fields.entries()) {
      for (const pattern of parsedPatterns) {
        if (
          (pattern.type === "exact" && key === pattern.value) ||
          (pattern.type === "prefix" && key.startsWith(pattern.value))
        ) {
          newFields.set(key, field);
        }
      }
    }
    return new KVConfigSchematics(this.valueTypeLibrary, newFields, this.baseKey);
  }

  /**
   * Get a subset of the config schema with a specific scope.
   */
  public scoped<TScopeKey extends string>(
    scopeKey: TScopeKey,
  ): KVConfigSchematics<
    TKVFieldValueTypeLibraryMap,
    {
      [TKey in keyof TKVConfigSchema & string as TKey extends `${TScopeKey}.${infer RInnerKey}`
        ? RInnerKey
        : never]: TKVConfigSchema[TKey];
    },
    `${TBaseKey}${TScopeKey}.`
  > {
    const newFields = new Map<string, KVConcreteFieldSchema>();
    for (const [key, field] of this.fields.entries()) {
      if (key.startsWith(`${scopeKey}.`)) {
        newFields.set(key.substring(scopeKey.length + 1), field);
      }
    }
    return new KVConfigSchematics(this.valueTypeLibrary, newFields, `${this.baseKey}${scopeKey}.`);
  }

  public union<TOtherKVConfigSchema extends KVVirtualConfigSchema>(
    other: KVConfigSchematics<
      TKVFieldValueTypeLibraryMap, // Must be the same
      TOtherKVConfigSchema,
      TBaseKey // Must be the same
    >,
  ): KVConfigSchematics<
    TKVFieldValueTypeLibraryMap,
    TKVConfigSchema & TOtherKVConfigSchema,
    TBaseKey
  > {
    if (this.baseKey !== other.baseKey) {
      throw new Error("Cannot union two config schematics with different base keys");
    }
    const newFields = new Map<string, KVConcreteFieldSchema>();
    for (const [key, field] of this.fields.entries()) {
      newFields.set(key, field);
    }
    for (const [key, field] of other.fields.entries()) {
      newFields.set(key, field);
    }
    return new KVConfigSchematics(this.valueTypeLibrary, newFields, this.baseKey);
  }

  public parseToMap(config: KVConfig) {
    const rawConfigMap = kvConfigToMap(config);
    const parsedConfigMap = new Map<string, any>();
    for (const [key, fieldSchema] of this.fields.entries()) {
      const fullKey = this.baseKey + key;
      const value = rawConfigMap.get(fullKey);
      const parsedValue = this.parseField(fieldSchema, fullKey, value);
      parsedConfigMap.set(key, parsedValue);
    }
    return parsedConfigMap;
  }

  /**
   * Parse the given config to a ParsedKVConfig. **Will throw** if the config does not satisfy the
   * schema.
   */
  public parse(config: KVConfig): ParsedKVConfig<TKVConfigSchema> {
    return ParsedKVConfig[createParsedKVConfig](this, this.parseToMap(config));
  }

  /**
   * Builds a full KV config from the given values record. **Will throw** if any of the values are
   * missing or do not satisfy the schema.
   */
  public buildFullConfig(valuesRecord: {
    [TKey in keyof TKVConfigSchema & string]?: TKVConfigSchema[TKey]["type"];
  }): KVConfig {
    return {
      fields: Array.from(this.fields.entries()).map(([key, fieldSchema]) => {
        const fullKey = this.baseKey + key;
        const value = this.parseField(fieldSchema, fullKey, valuesRecord[key]);
        return { key: fullKey, value };
      }),
    };
  }

  /**
   * Builds a partial KV config from the given values record. Will leave holes in the config if the
   * values are missing. **Will throw** if any of the values do not satisfy the schema.
   */
  public buildPartialConfig(valuesRecord: {
    [TKey in keyof TKVConfigSchema & string]?: TKVConfigSchema[TKey]["type"] | undefined;
  }): KVConfig {
    return {
      fields: Object.entries(valuesRecord)
        .filter(([_key, value]) => value !== undefined)
        .map(([key, value]) => {
          const fieldSchema = this.fields.get(key);
          if (fieldSchema === undefined) {
            throw new Error(`Field with key ${this.baseKey + key} does not exist`);
          }
          const fullKey = this.baseKey + key;
          return { key: fullKey, value: this.parseField(fieldSchema, fullKey, value) };
        }),
    };
  }

  public configBuilder(): KVConfigBuilder<TKVConfigSchema> {
    return new KVConfigBuilder(this.baseKey);
  }

  public clone(): KVConfigSchematics<TKVFieldValueTypeLibraryMap, TKVConfigSchema, TBaseKey> {
    return new KVConfigSchematics(this.valueTypeLibrary, new Map(this.fields), this.baseKey);
  }

  public withTypeParamOverride<
    TKey extends keyof TKVConfigSchema & string,
    TParam extends TKVFieldValueTypeLibraryMap[TKVConfigSchema[TKey]["valueTypeKey"]]["param"],
  >(key: TKey, paramMapper: (oldParam: TParam) => TParam) {
    const field = this.fields.get(key);
    if (field === undefined) {
      throw new Error(`Field with key ${this.baseKey + key} does not exist`);
    }
    const clone = this.clone();
    clone.fields.set(key, {
      ...field,
      valueTypeParams: paramMapper(field.valueTypeParams),
      schema: this.valueTypeLibrary.getSchema(
        field.valueTypeKey,
        paramMapper(field.valueTypeParams),
      ),
    });
    return clone;
  }
}

export class KVConfigBuilder<TKVConfigSchema extends KVVirtualConfigSchema> {
  public constructor(private readonly baseKey: string) {}
  private readonly fields: Map<string, any> = new Map();
  public with<TKey extends keyof TKVConfigSchema & string>(
    key: TKey,
    value: TKVConfigSchema[TKey]["type"],
  ) {
    this.fields.set(this.baseKey + key, value);
    return this;
  }
  public build() {
    return mapToKVConfig(this.fields);
  }
}

/**
 * This class can be only constructed via the `parse` method on `KVConfigSchema`. It is guaranteed
 * to satisfy the schema.
 */
export class ParsedKVConfig<TKVConfigSchema extends KVVirtualConfigSchema> {
  private constructor(
    private readonly schema: KVConfigSchematics<any, TKVConfigSchema, string>,
    /**
     * Guaranteed to satisfy the schema.
     */
    private readonly configMap: Map<string, any>,
  ) {}

  public static [createParsedKVConfig]<TKVConfigSchema extends KVVirtualConfigSchema>(
    schema: KVConfigSchematics<any, TKVConfigSchema, string>,
    configMap: Map<string, any>,
  ): ParsedKVConfig<TKVConfigSchema> {
    return new ParsedKVConfig(schema, configMap);
  }

  public get<TKey extends keyof TKVConfigSchema & string>(
    key: TKey,
  ): TKVConfigSchema[TKey]["type"] {
    return this.configMap.get(key);
  }
}

export function kvConfigToMap(config: KVConfig): Map<string, any> {
  return new Map(config.fields.map(f => [f.key, f.value]));
}

export function mapToKVConfig(map: Map<string, any>): KVConfig {
  return {
    fields: Array.from(map.entries()).map(([key, value]) => ({ key, value })),
  };
}

export function collapseKVStack(stack: KVConfigStack): KVConfig {
  const map: Map<string, any> = new Map();
  for (const layer of stack.layers) {
    for (const { key, value } of layer.config.fields) {
      map.set(key, value);
    }
  }
  return mapToKVConfig(map);
}

export function collapseKVStackRaw(configs: Array<KVConfig>): KVConfig {
  const map: Map<string, any> = new Map();
  for (const config of configs) {
    for (const { key, value } of config.fields) {
      map.set(key, value);
    }
  }
  return mapToKVConfig(map);
}

export const emptyKVConfig: KVConfig = {
  fields: [],
};

export function combineKVStack(stacks: Array<KVConfigStack>): KVConfigStack {
  return {
    layers: stacks.flatMap(s => s.layers),
  };
}

function deepEquals<T>(a: T, b: T) {
  if (a === b) {
    return true;
  }
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  if (Array.isArray(a)) {
    if (a.length !== (b as any)?.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], (b as any)[i])) {
        return false;
      }
    }
    return true;
  }
  const aKeys = new Set(Object.keys(a));
  const bKeys = new Set(Object.keys(b));
  if (aKeys.size !== bKeys.size) {
    return false;
  }
  for (const key of aKeys) {
    if (!bKeys.has(key)) {
      return false;
    }
    if (!deepEquals((a as any)[key], (b as any)[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Compare two config KV config subject to a schema. Only the fields that exist in the schematic
 * is compared. Default values are used for missing fields. (Meaning having a field with the same
 * value as the default value is considered equal to not having the field at all.)
 */
export function kvConfigEquals(
  schematics: KVConfigSchematics<any, any, any>,
  a: KVConfig,
  b: KVConfig,
) {
  const aMap = schematics.parseToMap(a);
  const bMap = schematics.parseToMap(b);

  for (const [aKey, aValue] of aMap) {
    const bValue = bMap.get(aKey);
    if (bValue === undefined) {
      return false;
    }
    if (!deepEquals(aValue, bValue)) {
      return false;
    }
  }

  return true;
}

/**
 * Gets all keys of a union type.
 */
type UnionKeyOf<T> = T extends T ? keyof T : never;

/**
 * Given a ConfigSchematic, gets the internal virtual schema with shortened keys.
 */
export type InferConfigSchemaMap<TKVConfigSchematics extends KVConfigSchematics<any, any, any>> =
  TKVConfigSchematics extends KVConfigSchematics<any, infer RSchema, any> ? RSchema : never;

/**
 * Given a ConfigSchematic, gets the shortened keys of the internal virtual schema.
 */
export type InferConfigSchemaKeys<TKVConfigSchematics extends KVConfigSchematics<any, any, any>> =
  UnionKeyOf<InferConfigSchemaMap<TKVConfigSchematics>>;

export type InferConfigSchemaFullMap<
  TKVConfigSchematics extends KVConfigSchematics<any, any, any>,
> =
  TKVConfigSchematics extends KVConfigSchematics<any, infer RSchema, infer RBaseKey>
    ? {
        [TKey in keyof RSchema as `${RBaseKey}${TKey & string}`]: RSchema[TKey];
      }
    : never;

export type InferConfigSchemaFullKeys<
  TKVConfigSchematics extends KVConfigSchematics<any, any, any>,
> = UnionKeyOf<InferConfigSchemaFullMap<TKVConfigSchematics>>;

export type InferValueTypeMap<TLibrary extends KVFieldValueTypeLibrary<any>> =
  TLibrary extends KVFieldValueTypeLibrary<infer RMap> ? RMap : never;

export type InferValueTypeKeys<TLibrary extends KVFieldValueTypeLibrary<any>> = UnionKeyOf<
  InferValueTypeMap<TLibrary>
>;
