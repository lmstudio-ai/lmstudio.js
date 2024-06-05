import { type KVConfig } from "@lmstudio/lms-shared-types";
import { type ZodSchema } from "zod";

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

/**
 * A builder for building a KVFieldValueTypeLibrary.
 *
 * The reason why a builder is used is to enable much better type inference when defining the value
 * types.
 */
export class KVFieldValueTypesLibraryBuilder<
  TKVFieldValueTypeLibraryMap extends KVVirtualFieldValueTypesMapping = {},
> {
  private readonly valueTypes: KVConcreteFieldValueTypesMap = new Map();

  /**
   * Define a new field value type.
   */
  public valueType<TKey extends string, TValueTypeParams, TValue>(
    key: TKey,
    params: {
      paramType: ZodSchema<TValueTypeParams>;
      schemaMaker: (param: TValueTypeParams) => ZodSchema<TValue>;
    },
  ): KVFieldValueTypesLibraryBuilder<
    TKVFieldValueTypeLibraryMap & {
      [key in TKey]: {
        value: TValue;
        param: TValueTypeParams;
      };
    }
  > {
    if (this.valueTypes.has(key)) {
      throw new Error(`ValueType with key ${key} already exists`);
    }
    this.valueTypes.set(key, params);
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
    params: TKVFieldValueTypeLibraryMap[TKey]["param"],
  ): ZodSchema<TKVFieldValueTypeLibraryMap[TKey]["value"]> {
    return this.valueTypes.get(key)!.schemaMaker(params);
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

type KVValueTypeDefBase = {
  type: string;
  value: any;
  param: any;
};

export type KVVirtualFieldSchema = {
  key: string;
  type: any;
};
type KVVirtualConfigSchema = {
  [key: string]: KVVirtualFieldSchema;
};

interface KVConcreteFieldSchema {
  // valueTypeDef: KVValueTypeDefBase;
  valueTypeKey: string;
  schema: ZodSchema;
  defaultValue?: any;
}

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
    defaultValue?: TKVFieldValueTypeLibraryMap[TValueTypeKey]["value"],
  ): KVConfigSchematicsBuilder<
    TKVFieldValueTypeLibraryMap,
    TKVConfigSchema & {
      [key in TKey]: {
        key: TKey;
        type: TKVFieldValueTypeLibraryMap[TValueTypeKey]["value"];
      };
    }
  > {
    if (defaultValue !== undefined) {
      const schema = this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams);
      const defaultValueParseResult = schema.safeParse(defaultValue);
      if (!defaultValueParseResult.success) {
        throw new Error(
          `Invalid default value for field ${key}: ${defaultValueParseResult.error.message}`,
        );
      }
      defaultValue = defaultValueParseResult.data;
    }
    const valueTypeDef: KVValueTypeDefBase = {
      type: valueTypeKey,
      value: this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams).parse(defaultValue),
      param: valueTypeParams,
    };
    this.fields.set(key, {
      valueTypeKey,
      schema: this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams),
      defaultValue,
    });
    return this as any;
  }

  /**
   * Adds a field with a transformation. That is, an additional step is taken to transform the value
   * after it has been initially parsed.
   */
  public fieldRefine<
    TKey extends string,
    TValueTypeKey extends keyof TKVFieldValueTypeLibraryMap & string,
    TRefinedType,
  >(
    key: TKey,
    valueTypeKey: TValueTypeKey,
    valueTypeParams: TKVFieldValueTypeLibraryMap[TValueTypeKey]["param"],
    transform: (input: TKVFieldValueTypeLibraryMap[TValueTypeKey]["value"]) => TRefinedType,
    defaultValue?: TKVFieldValueTypeLibraryMap[TValueTypeKey]["value"],
  ): KVConfigSchematicsBuilder<
    TKVFieldValueTypeLibraryMap,
    TKVConfigSchema & {
      [key in TKey]: {
        key: TKey;
        type: TRefinedType;
      };
    }
  > {
    let transformedDefaultValue: TRefinedType | undefined;
    if (defaultValue !== undefined) {
      const schema = this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams);
      const defaultValueParseResult = schema.safeParse(defaultValue);
      if (!defaultValueParseResult.success) {
        throw new Error(
          `Invalid default value for field ${key}: ${defaultValueParseResult.error.message}`,
        );
      }
      transformedDefaultValue = transform(defaultValueParseResult.data);
    }
    this.fields.set(key, {
      valueTypeKey,
      schema: this.valueTypeLibrary.getSchema(valueTypeKey, valueTypeParams).transform(transform),
      defaultValue: transformedDefaultValue,
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
        string as `${TScopeKey}:${InnerKey}`]: TInnerConfigSchema[InnerKey];
    }
  > {
    const innerBuilder = fn(new KVConfigSchematicsBuilder(this.valueTypeLibrary));
    for (const [key, { valueTypeKey, schema, defaultValue }] of innerBuilder.fields.entries()) {
      this.fields.set(`${scopeKey}:${key}`, {
        valueTypeKey,
        schema,
        defaultValue,
      });
    }
    return this as any;
  }

  public build(): KVConfigSchematics<TKVConfigSchema> {
    return new KVConfigSchematics(this.fields);
  }
}

const createParsedKVConfig = Symbol("createParsedKVConfig");

export class KVConfigSchematics<TKVConfigSchema extends KVVirtualConfigSchema> {
  public constructor(
    private readonly fields: Map<string, KVConcreteFieldSchema>,
    private readonly baseKey: string = "",
  ) {}

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
    return fieldSchema.schema.parse(value);
  }

  /**
   * Parse and access a field in the config.
   */
  public access<TKey extends keyof TKVConfigSchema & string>(
    config: KVConfig,
    key: TKey,
  ): TKVConfigSchema[TKey]["type"] {
    const fullKey = this.baseKey + key;
    const fieldSchema = this.fields.get(fullKey);
    if (fieldSchema === undefined) {
      throw new Error(`Field with key ${fullKey} does not exist`);
    }
    return this.parseField(fieldSchema, fullKey, config.fields.find(f => f.key === fullKey)?.value);
  }

  // /**
  //  * Get a subset of the config schema with a specific scope.
  //  */
  // public scoped<TScopeKey extends string>(
  //   scopeKey: TScopeKey,
  // ): KVConfigSchema<{
  //   [key in keyof TKVConfigSchema & string as key extends `${TScopeKey}:${infer _}`
  //     ? key
  //     : never]: TKVConfigSchema[key];
  // }> {
  //   const newFields = new Map<string, KVConcreteFieldSchema>();
  //   for (const [key, field] of this.fields.entries()) {
  //     if (key.startsWith(`${scopeKey}:`)) {
  //       newFields.set(key, field);
  //     }
  //   }
  //   return new KVConfigSchema(newFields);
  // }

  /**
   * Get a subset of the config schema with a specific scope.
   */
  public scoped<TScopeKey extends string>(
    scopeKey: TScopeKey,
  ): KVConfigSchematics<{
    [TKey in keyof TKVConfigSchema & string as TKey extends `${TScopeKey}:${infer RInnerKey}`
      ? RInnerKey
      : never]: TKVConfigSchema[TKey];
  }> {
    const newFields = new Map<string, KVConcreteFieldSchema>();
    for (const [key, field] of this.fields.entries()) {
      if (key.startsWith(`${scopeKey}:`)) {
        newFields.set(key.substring(scopeKey.length + 1), field);
      }
    }
    return new KVConfigSchematics(newFields, `${scopeKey}:`);
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
}

/**
 * This class can be only constructed via the `parse` method on `KVConfigSchema`. It is guaranteed
 * to satisfy the schema.
 */
export class ParsedKVConfig<TKVConfigSchema extends KVVirtualConfigSchema> {
  private constructor(
    private readonly schema: KVConfigSchematics<TKVConfigSchema>,
    /**
     * Guaranteed to satisfy the schema.
     */
    private readonly configMap: Map<string, any>,
  ) {}

  public static [createParsedKVConfig]<TKVConfigSchema extends KVVirtualConfigSchema>(
    schema: KVConfigSchematics<TKVConfigSchema>,
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
