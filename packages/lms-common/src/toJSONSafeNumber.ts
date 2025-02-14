export function toJSONSafeNumber(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  } else if (!Number.isFinite(value)) {
    return undefined;
  } else if (Number.isNaN(value)) {
    return undefined;
  } else {
    return value;
  }
}
