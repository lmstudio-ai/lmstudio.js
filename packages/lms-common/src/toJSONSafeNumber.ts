export function toJSONSafeNumber(value: number): number | undefined {
  if (!Number.isFinite(value)) {
    return undefined;
  } else if (Number.isNaN(value)) {
    return undefined;
  } else {
    return value;
  }
}
