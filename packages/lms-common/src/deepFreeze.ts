export function deepFreeze(obj: any) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Object.isFrozen(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}
