import { enablePatches } from "immer";
import "./polyfill";

enablePatches();

// Export lazy signal first to avoid circular dependency issues
export { LazySignal } from "./LazySignal";

export { BufferedEvent } from "./BufferedEvent";
export { Event } from "./Event";
export { Signal, SignalSetter } from "./Signal";
export { LoggerInterface, SimpleLogger } from "./SimpleLogger";
export { StreamablePromise } from "./StreamablePromise";
export { TimeoutTracker } from "./TimeoutTracker";
export { PagerExitedError, QueueClearedError, WaitQueue } from "./WaitQueue";
export { lmsDefaultPorts } from "./lmsDefaultPorts";
export { makePromise } from "./makePromise";
export {
  prettyPrintZod,
  validateConstructorParamOrThrow,
  validateConstructorParamsOrThrow,
  validateMethodParamOrThrow,
  validateMethodParamsOrThrow,
  validateMultipleOrThrow,
  validateOrThrow,
} from "./prettyPrintZod";
export { removeUndefinedValues } from "./removeUndefinedValues";
export {
  MaybeErrored,
  Result,
  createResultSchema,
  maybeErroredSchema,
  promiseToMaybeErrored,
  promiseToResult,
  unwrapPromiseOfMaybeErrored,
  unwrapPromiseOfResult,
} from "./resultTypes";
export { runOnDispose } from "./runOnDispose";
export { text } from "./text";
export { toJSONSafeNumber } from "./toJSONSafeNumber";
