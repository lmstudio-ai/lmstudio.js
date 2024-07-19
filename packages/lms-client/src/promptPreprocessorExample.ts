import { type PromptPreprocessController } from "./llm/processor/PormptPreprocessorController";
import { type PromptPreprocessor } from "./llm/processor/PromptPreprocessor";
import { LMStudioClient } from "./LMStudioClient";

class A implements PromptPreprocessor {
  public readonly identifier = "example";
  public async preprocess(ctl: PromptPreprocessController) {
    const text = ctl.getUserMessage().text;

    console.info(text);
    const waiting = ctl.createStatus({
      status: "loading",
      text: "toUppercase...",
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    waiting.setState({
      status: "done",
      text: "toUppercase..." + text,
    });

    ctl.createCitationBlock("Cited text", {
      absoluteFilePath: "path",
      fileName: "file",
      lineNumber: [1, 20],
    });

    return text.toUpperCase();
  }
}

(async () => {
  const client = new LMStudioClient();
  client.llm.unstable_registerPromptPreprocessor(new A());
})();
