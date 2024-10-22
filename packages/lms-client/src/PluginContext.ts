import { type Generator } from "./llm/processing/Generator";
import { type Preprocessor } from "./llm/processing/Preprocessor";

/**
 * @public
 */
export interface PluginContext {
  /**
   * Sets the generator associated with this plugin context. Returns a the same PluginContext.
   */
  withGenerator(generate: Generator): PluginContext;
  /**
   * Sets the preprocessor associated with this plugin context. Returns a the same PluginContext.
   */
  withPreprocessor(preprocess: Preprocessor): PluginContext;
}
