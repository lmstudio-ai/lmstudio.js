import chalk from "chalk";
import { type SafeParseError, type ZodError, type z } from "zod";
import { text } from "./text";

/**
 * Pretty-prints a Zod error.
 *
 * @param rootObjectName - The name of the object being validated (used for error messages)
 * @param error - The Zod error to pretty-print
 *
 * @returns The pretty-printed error in a string
 */
export function prettyPrintZod(rootObjectName: string, error: ZodError) {
  return error.errors
    .map(e => {
      if (e.path.length === 0) {
        return `- ${chalk.redBright(rootObjectName)}: ${e.message}`;
      }
      const path = chalk.red(`.${e.path.join(".")}`);
      return `- ${chalk.redBright(rootObjectName)}${path}: ${e.message}`;
    })
    .join("\n");
}

/**
 * Validates a value against a schema and throws an error if it's invalid.
 *
 * @param lead - The start of the error message (used for error messages)
 * @param rootObjectName - The name of the object being validated (used for error messages)
 * @param schema - The schema to validate against
 * @param value - The value to validate
 *
 * @returns The validated value
 * @throws An error if the value is invalid
 */
export function validateOrThrow<T>(
  lead: string,
  rootObjectName: string,
  schema: z.Schema<T>,
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(`${lead}\n\n${prettyPrintZod(rootObjectName, result.error)}\n`);
  }
}

/**
 * Validates multiple values against multiple schemas and throws an error if any of them are
 * invalid. All values are validated before any errors are thrown. This is useful when you want to
 * validate multiple values at once and want to see all the errors at once.
 *
 * @param leadProducer - The function to produce the start of the error message (used for error). It
 * is called with a set of indices of the invalid values.
 * @param rootObjectNames - The names of the objects being validated (used for error messages)
 * @param schemas - The schemas to validate against
 * @param values - The values to validate
 *
 * @returns The validated values
 * @throws An error if any of the values are invalid
 */
export function validateMultipleOrThrow<T extends Array<unknown>>(
  leadProducer: (erroredValues: Set<number>) => string,
  rootObjectNames: Array<string>,
  schemas: Array<z.Schema<unknown>>,
  values: T,
): T {
  const results = schemas.map((schema, index) => schema.safeParse(values[index]));
  const errors = results
    .map((result, index) => ({ result, index, rootObjectName: rootObjectNames[index] }))
    .filter(({ result }) => !result.success)
    .map(({ result, rootObjectName, index }) => ({
      error: (result as SafeParseError<unknown>).error,
      rootObjectName,
      index,
    }));
  if (errors.length === 0) {
    return values as T;
  } else {
    const erroredValues = new Set(errors.map(({ index }) => index));
    const lead = leadProducer(erroredValues);
    throw new Error(
      `${lead}\n\n${errors
        .map(({ error, rootObjectName }) => prettyPrintZod(rootObjectName, error))
        .join("\n")}\n`,
    );
  }
}

/**
 * Validates a value against a schema and throws an error if it's invalid. This is a convenience
 * function for validating one single method parameter.
 *
 * @param className - The name of the class containing the method (used for error messages)
 * @param methodName - The name of the method (used for error messages)
 * @param paramName - The name of the parameter being validated (used for error messages)
 * @param schema - The schema to validate against
 * @param value - The value to validate
 *
 * @returns The validated value
 * @throws An error if the value is invalid
 */
export function validateMethodParamOrThrow<T>(
  className: string,
  methodName: string,
  paramName: string,
  schema: z.Schema<T>,
  value: unknown,
): T {
  const functionCall = chalk.yellowBright(text`
    ${className}#${methodName}(${chalk.redBright(paramName)})
  `);
  return validateOrThrow(`Invalid parameter(s) for ${functionCall}:`, paramName, schema, value);
}

/**
 * Validates multiple values against multiple schemas and throws an error if any of them are
 * invalid. This is a convenience function for validating multiple method parameters.
 *
 * @param className - The name of the class containing the method (used for error messages)
 * @param methodName - The name of the method (used for error messages)
 * @param paramNames - The names of the parameters being validated (used for error messages)
 * @param schemas - The schemas to validate against
 * @param values - The values to validate
 *
 * @returns The validated values
 * @throws An error if any of the values are invalid
 */
export function validateMethodParamsOrThrow<T extends Array<unknown>>(
  className: string,
  methodName: string,
  paramNames: Array<string>,
  schemas: Array<z.Schema<unknown>>,
  values: T,
): T {
  return validateMultipleOrThrow(
    erroredValues => {
      const coloredParamNames = paramNames.map((name, index) =>
        erroredValues.has(index) ? chalk.redBright(name) : name,
      );
      const functionCall = chalk.yellowBright(text`
        ${className}#${methodName}(${coloredParamNames.join(", ")})
      `);
      return `Invalid parameter(s) for ${functionCall}:`;
    },
    paramNames,
    schemas,
    values,
  );
}

/**
 * Validates a value against a schema and throws an error if it's invalid. This is a convenience
 * function for validating one single constructor parameter.
 *
 * @param className - The name of the class (used for error messages)
 * @param paramName - The name of the parameter being validated (used for error messages)
 * @param schema - The schema to validate against
 * @param value - The value to validate
 *
 * @returns The validated value
 * @throws An error if the value is invalid
 */
export function validateConstructorParamOrThrow<T>(
  className: string,
  paramName: string,
  schema: z.Schema<T>,
  value: unknown,
): T {
  const functionCall = chalk.yellowBright(text`
    ${className}(${chalk.redBright(paramName)})
  `);
  return validateOrThrow(
    `Invalid parameter(s) when constructing ${functionCall}`,
    paramName,
    schema,
    value,
  );
}

/**
 * Validates multiple values against multiple schemas and throws an error if any of them are
 * invalid. This is a convenience function for validating multiple constructor parameters.
 *
 * @param className - The name of the class (used for error messages)
 * @param paramNames - The names of the parameters being validated (used for error messages)
 *
 * @param schemas - The schemas to validate against
 * @param values - The values to validate
 */
export function validateConstructorParamsOrThrow<T extends Array<unknown>>(
  className: string,
  paramNames: Array<string>,
  schemas: Array<z.Schema<unknown>>,
  values: T,
): T {
  return validateMultipleOrThrow(
    erroredValues => {
      const coloredParamNames = paramNames.map((name, index) =>
        erroredValues.has(index) ? chalk.redBright(name) : name,
      );
      const functionCall = chalk.yellowBright(text`
        ${className}(${coloredParamNames.join(", ")})
      `);
      return `Invalid parameter(s) when constructing ${functionCall}:`;
    },
    paramNames,
    schemas,
    values,
  );
}
