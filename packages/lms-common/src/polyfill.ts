// Extremely lightweight polyfill for Symbol.dispose and Symbol.asyncDispose
if (typeof Symbol.dispose !== "symbol") {
  Object.defineProperty(Symbol, "dispose", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Symbol.for("dispose"),
  });
}
if (typeof Symbol.asyncDispose !== "symbol") {
  Object.defineProperty(Symbol, "asyncDispose", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Symbol.for("asyncDispose"),
  });
}
