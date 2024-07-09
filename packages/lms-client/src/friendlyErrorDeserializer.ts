import { makePrettyError, makeTitledPrettyError, text } from "@lmstudio/lms-common";
import {
  attachSerializedErrorData,
  type ErrorDisplayData,
  type ModelQuery,
  type SerializedLMSExtendedError,
} from "@lmstudio/lms-shared-types";
import chalk from "chalk";

type DisplayData<TCode extends ErrorDisplayData["code"]> = Extract<
  ErrorDisplayData,
  { code: TCode }
>;

function deserializeOtherError(serialized: SerializedLMSExtendedError, stack?: string): Error {
  let content = chalk.bgRed.white(` ${serialized.title} `);
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

const errorDeserializersMap = new Map<string, (data: ErrorDisplayData, stack?: string) => Error>();
function registerErrorDeserializer<TCode extends ErrorDisplayData["code"]>(
  code: TCode,
  deserializer: (data: DisplayData<TCode>, stack?: string) => Error,
) {
  errorDeserializersMap.set(code, deserializer as any);
}

function formatAvailableLLMs(availablePathsSample: Array<string>, totalModels: number) {
  if (availablePathsSample.length === 0) {
    return chalk.gray("    You don't have any LLMs downloaded.");
  }
  let text = availablePathsSample.map(path => chalk.cyanBright(" · " + path)).join("\n");
  if (availablePathsSample.length < totalModels) {
    text += chalk.gray(`\n     ... (and ${totalModels - availablePathsSample.length} more)`);
  }
  return text;
}

registerErrorDeserializer(
  "llm.pathNotFound",
  ({ availablePathsSample, path, totalModels }, stack) => {
    return makeTitledPrettyError(
      `Cannot find an LLM with path "${chalk.yellowBright(path)}"`,
      text`
        Here are your available LLMs:

        ${formatAvailableLLMs(availablePathsSample, totalModels)}

        Run

            ${chalk.yellowBright("lms ls")}

        to see a full list of loadable models
      `,
      stack,
    );
  },
);

function formatLoadedLLMs(loadedModelsSample: Array<string>, totalLoadedModels: number) {
  if (loadedModelsSample.length === 0) {
    return chalk.gray("    You don't have any LLMs loaded.");
  }
  let text = loadedModelsSample.map(path => chalk.cyanBright(" · " + path)).join("\n");
  if (loadedModelsSample.length < totalLoadedModels) {
    text += chalk.gray(`\n     ... (and ${totalLoadedModels - loadedModelsSample.length} more)`);
  }
  return text;
}

registerErrorDeserializer(
  "llm.identifierNotFound",
  ({ loadedModelsSample, identifier, totalLoadedModels }, stack) => {
    return makeTitledPrettyError(
      `Cannot find an LLM with identifier "${chalk.yellowBright(identifier)}"`,
      text`
        Here are your loaded LLMs:

        ${formatLoadedLLMs(loadedModelsSample, totalLoadedModels)}

        Run

            ${chalk.yellowBright("lms ps")}

        to see a full list of loaded models
      `,
      stack,
    );
  },
);

registerErrorDeserializer("generic.specificModelUnloaded", (_, stack) => {
  return makePrettyError(
    chalk.bgRed.white(text`
    This model has already been unloaded.
  `),
    stack,
  );
});

function formatQuery(query: ModelQuery) {
  const requirements: Array<string> = [];
  if (query.identifier !== undefined) {
    requirements.push(`The identifier must be exactly "${chalk.yellowBright(query.identifier)}"`);
  }
  if (query.path !== undefined) {
    requirements.push(`The path must match "${chalk.yellowBright(query.path)}"`);
  }
  if (requirements.length === 0) {
    return chalk.gray(" · Any LLM");
  }
  requirements.unshift("The model must be an LLM");
  return requirements.map(req => chalk.white(" · " + req)).join("\n");
}

registerErrorDeserializer(
  "generic.noModelMatchingQuery",
  ({ loadedModelsSample, totalLoadedModels }, stack) => {
    return makePrettyError(
      text`
        ${chalk.bgRed.white(" No loaded LLM satisfies all requirements specified in the query. ")}

        Loaded LLMs:

        ${formatLoadedLLMs(loadedModelsSample, totalLoadedModels)}

        Run

            ${chalk.yellowBright("lms ps")}

        to see a full list of loaded models with details
      `,
      stack,
    );
  },
);

export function friendlyErrorDeserializer(
  serialized: SerializedLMSExtendedError,
  _directCause: string,
  stack?: string,
): Error {
  if (serialized.displayData === undefined) {
    return deserializeOtherError(serialized, stack);
  }
  let error: Error;
  const specificDeserializer = errorDeserializersMap.get(serialized.displayData.code);
  if (specificDeserializer !== undefined) {
    error = specificDeserializer(serialized.displayData, stack);
    attachSerializedErrorData(error, serialized);
    return error;
  } else {
    return deserializeOtherError(serialized, stack);
  }
}
