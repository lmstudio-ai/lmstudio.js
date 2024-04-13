export function runOnDispose(fn: () => void) {
  return {
    [Symbol.dispose]: fn,
  };
}
