import { enablePatches } from "immer";
import "./polyfill";

enablePatches();

// Export lazy signal first to avoid circular dependency issues
export { LazySignal } from "./LazySignal";

export { BufferedEvent } from "./BufferedEvent";
export { changeErrorStackInPlace, getCurrentStack } from "./errorStack";
export { Event } from "./Event";
export { lmsDefaultPorts } from "./lmsDefaultPorts";
export { makePrettyError, makeTitledPrettyError } from "./makePrettyError";
export { makePromise } from "./makePromise";
export { removeUndefinedValues } from "./removeUndefinedValues";
export {
  createResultSchema,
  MaybeErrored,
  maybeErroredSchema,
  promiseToMaybeErrored,
  promiseToResult,
  Result,
  unwrapPromiseOfMaybeErrored,
  unwrapPromiseOfResult,
} from "./resultTypes";
export { runOnDispose } from "./runOnDispose";
export { Signal, SignalSetter } from "./Signal";
export { LoggerInterface, SimpleLogger } from "./SimpleLogger";
export { StreamablePromise } from "./StreamablePromise";
export { text } from "./text";
export { TimeoutTracker } from "./TimeoutTracker";
export { toJSONSafeNumber } from "./toJSONSafeNumber";
export { Validator } from "./Validator";
export { PagerExitedError, QueueClearedError, WaitQueue } from "./WaitQueue";
export { failOk, filteredArray } from "./zodHelpers";
