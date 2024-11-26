import { type ConfigSchematics, type VirtualConfigSchematics } from "./customConfig.js";
import { type Generator } from "./plugins/processing/Generator.js";
import { type Preprocessor } from "./plugins/processing/Preprocessor.js";

/**
 * @public
 */
export interface PluginContext {
  /**
   * Sets the config schematics associated with this plugin context. Returns the same PluginContext.
   */
  withConfigSchematics: (
    configSchematics: ConfigSchematics<VirtualConfigSchematics>,
  ) => PluginContext;
  /**
   * Sets the generator associated with this plugin context. Returns the same PluginContext.
   */
  withGenerator(generate: Generator): PluginContext;
  /**
   * Sets the preprocessor associated with this plugin context. Returns the same PluginContext.
   */
  withPreprocessor(preprocess: Preprocessor): PluginContext;
}
