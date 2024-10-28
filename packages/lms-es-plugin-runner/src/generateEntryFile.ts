const template = `\
import { main } from "./../src/index.ts";
import { LMStudioClient, type PluginContext } from "@lmstudio/sdk";

declare var process: any;

// We receive runtime information in the environment variables.
const clientIdentifier = process.env.LMS_PLUGIN_CLIENT_IDENTIFIER;
const clientPasskey = process.env.LMS_PLUGIN_CLIENT_PASSKEY;

const client = new LMStudioClient({
  clientIdentifier,
  clientPasskey,
});

let generatorSet = false;
let preprocessorSet = false;
let configSchematicsSet = false;

const pluginContext: PluginContext = {
  withGenerator: (generate) => {
    if (generatorSet) {
      throw new Error("Generator already registered");
    }
    generatorSet = true;
    client.plugins.setGenerator({
      identifier: clientIdentifier,
      generate,
    });
    return pluginContext;
  },
  withPreprocessor: (preprocess) => {
    if (preprocessorSet) {
      throw new Error("Preprocessor already registered");
    }
    preprocessorSet = true;
    client.plugins.setPreprocessor({
      identifier: clientIdentifier,
      preprocess,
    });
    return pluginContext;
  },
  withConfigSchematics: (configSchematics) => {
    if (configSchematicsSet) {
      throw new Error("Config schematics already registered");
    }
    configSchematicsSet = true;
    client.plugins.setConfigSchematics(configSchematics);
    return pluginContext;
  },
};

main(pluginContext).then(() => {
  client.plugins.initCompleted();
}).catch((error) => {
  console.error("Failed to execute the main function of the plugin.");
  console.error(error);
});
`;

interface GenerateEntryFileOpts {}
export function generateEntryFile(_opts: GenerateEntryFileOpts) {
  return template;
}
