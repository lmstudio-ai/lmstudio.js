/**
 * Translate a number to a checkbox numeric value.
 *
 * @param value - The value to translate.
 * @param uncheckedValue - The value to use when the checkbox is unchecked.
 * @param valueWhenUnchecked - The value to use when the checkbox is unchecked.
 */
export function numberToCheckboxNumeric(
  value: number | undefined,
  uncheckedValue: number,
  valueWhenUnchecked: number,
): undefined | { checked: boolean; value: number } {
  if (value === undefined) {
    return undefined;
  }
  if (value === uncheckedValue) {
    return { checked: false, value: valueWhenUnchecked };
  }
  return { checked: true, value };
}
