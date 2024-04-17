// Error stack manipulation related functions

export function getCurrentStack(goAbove = 0) {
  const stack = new Error().stack;
  if (!stack) {
    return "";
  }
  const lines = stack.split("\n");
  return lines.slice(1 + goAbove).join("\n");
}

export function changeErrorStackInPlace(error: Error, newStack: string) {
  const stackContent = error.stack ?? "";
  error.stack =
    stackContent.substring(0, stackContent.indexOf("    at ")).trimEnd() + "\n" + newStack;
}
