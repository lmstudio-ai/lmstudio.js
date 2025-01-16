import { type LLMLlamaCacheQuantizationType } from "@lmstudio/lms-shared-types";

export function cacheQuantizationTypeToCheckbox({
  value,
  falseDefault,
}: {
  value: LLMLlamaCacheQuantizationType | false | undefined;
  falseDefault: LLMLlamaCacheQuantizationType;
}) {
  return value === undefined
    ? undefined
    : value === false
      ? { checked: false, value: falseDefault }
      : { checked: true, value: value };
}
