import { type PromptPreprocessor } from "./llm/processor/PromptPreprocessor";
import { type PromptPreprocessController } from "./llm/processor/PromptPreprocessorController";
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
    const aaa = waiting.addSubStatus({
      status: "waiting",
      text: "aaa",
    });
    const bbb = aaa.addSubStatus({
      status: "waiting",
      text: "bbb",
    });
    const ccc = waiting.addSubStatus({
      status: "waiting",
      text: "ccc",
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    aaa.setState({
      status: "done",
      text: "aaa",
    });
    bbb.setState({
      status: "done",
      text: "bbb",
    });
    ccc.setState({
      status: "done",
      text: "ccc",
    });
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
