/**
 * Convert a number that can be false to checkbox numeric value.
 *
 * @param maybeFalseNumber - The value to translate.
 * @param valueWhenUnchecked - The value to use when the checkbox is unchecked.
 */
export function maybeFalseNumberToCheckboxNumeric(
  maybeFalseNumber: undefined | number | false,
  valueWhenUnchecked: number,
): undefined | { checked: boolean; value: number } {
  if (maybeFalseNumber === undefined) {
    return undefined;
  }
  if (maybeFalseNumber === false) {
    return { checked: false, value: valueWhenUnchecked };
  }
  return { checked: true, value: maybeFalseNumber };
}
