/**
 * Removes static properties from a type. This allows defining static methods on a subclass that is
 * not compatible with the parent class.
 *
 * https://github.com/microsoft/TypeScript/issues/4628#issuecomment-1147905253
 */
export type OmitStatics<T, S extends string> = T extends { new (...args: infer A): infer R }
  ? { new (...args: A): R } & Omit<T, S>
  : Omit<T, S>;
