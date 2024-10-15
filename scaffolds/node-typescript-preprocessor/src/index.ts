import { LMStudioClient } from "@lmstudio/lms-client/src/LMStudioClient";

(async () => {
  const client = new LMStudioClient();
  client.llm.registerPreprocessor({
    identifier: "example - prepend date",
    preprocess: async (ctl, userMessage) => {
      const dateTime = new Date().toLocaleString();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return `(Current time: ${dateTime} ${timeZone})\n${userMessage.getText()}`;
    },
  });
  client.llm.registerPreprocessor({
    identifier: "example - think step-by-step",
    preprocess: async (ctl, userMessage) => {
      return `${userMessage.getText()}\n\nPlease think step-by-step.`;
    },
  });
})();
