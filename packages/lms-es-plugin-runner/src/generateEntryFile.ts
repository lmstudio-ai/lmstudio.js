const template = `\
import { main } from "./../src/index.ts";
import { LMStudioClient, type PluginContext } from "@lmstudio/sdk";

declare var process: any;

// We receive runtime information in the environment variables.

const clientIdentifier = process.env.LMS_CLIENT_IDENTIFIER;
const clientPasskey = process.env.LMS_CLIENT_PASSKEY;

const client = new LMStudioClient({
  clientIdentifier,
  clientPasskey,
});

let generatorRegistered = false;
let preprocessorRegistered = false;

const pluginContext: PluginContext = {
  withGenerator: (generate) => {
    if (generatorRegistered) {
      throw new Error("Generator already registered");
    }
    generatorRegistered = true;
    client.llm.registerGenerator({
      identifier: clientIdentifier,
      generate,
    });
    return pluginContext;
  },
  withPreprocessor: (preprocess) => {
    if (preprocessorRegistered) {
      throw new Error("Preprocessor already registered");
    }
    preprocessorRegistered = true;
    client.llm.registerPreprocessor({
      identifier: clientIdentifier,
      preprocess,
    });
    return pluginContext;
  },
};

main(pluginContext).catch((error) => {
  console.error("Failed to execute the main function of the plugin.");
  console.error(error);
});
`;

interface GenerateEntryFileOpts {}
export function generateEntryFile(_opts: GenerateEntryFileOpts) {
  return template;
}
