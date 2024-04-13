/**
 * Removes properties with `undefined` values from an object.
 *
 * This function can be useful in scenarios where you want to ensure that an object does not contain
 * any `undefined` values. For example, when the resulting value is used to overwrite some default
 * values.
 *
 * Note: This function does not mutate the original object. It returns a new object that does not
 * include the `undefined` values.
 *
 * @param obj - The object from which to remove `undefined` values.
 * @returns A new object that does not include the `undefined` values.
 * @example
 * ```typescript
 * const obj = { a: 1, b: undefined, c: 'test' };
 * const result = removeUndefinedValues(obj);
 * console.log(result); // { a: 1, c: 'test' }
 * ```
 */
export function removeUndefinedValues<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as T;
}
