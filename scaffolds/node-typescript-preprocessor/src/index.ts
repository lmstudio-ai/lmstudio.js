import { LMStudioClient } from "@lmstudio/lms-client/src/LMStudioClient";

(async () => {
  const client = new LMStudioClient();
  client.llm.registerPromptPreprocessor({
    identifier: "example - prepend date",
    preprocess: async ctl => {
      const dateTime = new Date().toLocaleString();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return `(Current time: ${dateTime} ${timeZone})\n${ctl.getUserMessage().text}`;
    },
  });
  client.llm.registerPromptPreprocessor({
    identifier: "example - think step-by-step",
    preprocess: async ctl => {
      return `${ctl.getUserMessage().text}\n\nPlease think step-by-step.`;
    },
  });
})();
