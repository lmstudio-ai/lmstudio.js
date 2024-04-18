import { makePrettyError, text } from "@lmstudio/lms-common";
import {
  attachSerializedErrorData,
  type ErrorDisplayData,
  type SerializedLMSExtendedError,
} from "@lmstudio/lms-shared-types";
import chalk from "chalk";

type DisplayData<TCode extends ErrorDisplayData["code"]> = Extract<
  ErrorDisplayData,
  { code: TCode }
>;

function deserializeOtherError(serialized: SerializedLMSExtendedError, stack?: string): Error {
  let content = chalk.redBright(serialized.title);
  if (serialized.suggestion !== undefined) {
    content +=
      "\n\n\n " +
      chalk.bgWhite.black("  (!) SUGGESTION  ") +
      "\n\n" +
      chalk.white(serialized.suggestion);
  }
  if (serialized.cause !== undefined) {
    content +=
      "\n\n\n " + chalk.bgWhite.black("  (X) CAUSE  ") + "\n\n" + chalk.gray(serialized.cause);
  }
  return makePrettyError(content, stack);
}

function deserializeLLMPathNotFoundError(
  { availablePathsSample, path, totalModels }: DisplayData<"llm.pathNotFound">,
  stack?: string,
): Error {
  return makePrettyError(
    text`
      ${chalk.redBright(text`
        Cannot find an LLM with path "${chalk.yellowBright(path)}".
      `)}

      Here are your available LLM's:

      ${
        availablePathsSample.length === 0
          ? chalk.gray("You don't have any LLM's downloaded.")
          : availablePathsSample.map(path => chalk.cyanBright(" - " + path)).join("\n") +
            (availablePathsSample.length < totalModels
              ? chalk.gray(`\n     ... (and ${totalModels - availablePathsSample.length} more)`)
              : "")
      }

      Run

          ${chalk.yellowBright("lms ls")}

      to see a full list of loadable models
    `,
    stack,
  );
}

export function friendlyErrorDeserializer(
  serialized: SerializedLMSExtendedError,
  stack?: string,
): Error {
  if (serialized.displayData === undefined) {
    return deserializeOtherError(serialized, stack);
  }
  let error: Error;
  switch (serialized.displayData.code) {
    case "llm.pathNotFound":
      error = deserializeLLMPathNotFoundError(serialized.displayData, stack);
      break;
    default:
      return deserializeOtherError(serialized, stack);
  }
  attachSerializedErrorData(error, serialized);
  return error;
}
