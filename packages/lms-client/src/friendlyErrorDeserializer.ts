import { text } from "@lmstudio/lms-common";
import {
  attachSerializedErrorData,
  type ErrorDisplayData,
  fromSerializedError,
  type SerializedLMSExtendedError,
} from "@lmstudio/lms-shared-types";
import chalk from "chalk";
import { makePrettyError } from "./makePrettyError";

type DisplayData<TCode extends ErrorDisplayData["code"]> = Extract<
  ErrorDisplayData,
  { code: TCode }
>;

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
    return fromSerializedError(serialized);
  }
  let error: Error;
  switch (serialized.displayData.code) {
    case "llm.pathNotFound":
      error = deserializeLLMPathNotFoundError(serialized.displayData, stack);
      break;
    default:
      return fromSerializedError(serialized);
  }
  attachSerializedErrorData(error, serialized);
  return error;
}
