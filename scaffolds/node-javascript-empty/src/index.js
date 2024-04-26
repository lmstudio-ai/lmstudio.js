const { LMStudioClient } = require("@lmstudio/sdk");

async function main() {
  const client = new LMStudioClient();
  console.log("Welcome to my new project! Here are the downloaded models:");
  console.log(await client.system.listDownloadedModels());
  console.log("For more, visit our documentation website at https://lmstudio.ai/docs/welcome");
}
main();
