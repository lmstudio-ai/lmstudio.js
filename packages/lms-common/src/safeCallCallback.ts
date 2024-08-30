import { type SimpleLogger } from "./SimpleLogger";

/**
 * Call a user provided callback and log any errors that occur. This prevents the error from
 * crashing the application.
 */
export function safeCallCallback<TArgs extends Array<unknown>>(
  logger: SimpleLogger,
  name: string,
  callback: ((...args: TArgs) => void) | undefined,
  args: TArgs,
) {
  if (callback === undefined) {
    return;
  }
  try {
    const maybePromise = callback(...args) as any;
    if (typeof maybePromise === "object" && typeof maybePromise.catch === "function") {
      maybePromise.catch((error: Error) => {
        logger.error(`Error in the ${name} callback (triggered asynchronously):`, error);
      });
    }
  } catch (error) {
    logger.error(`Error in the ${name} callback:`, error);
  }
}
