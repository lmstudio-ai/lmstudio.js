const { LMStudioClient } = require("@lmstudio/sdk");

async function main() {
  const client = new LMStudioClient();
  console.log("👾👾 Welcome to my new project! 👾👾");
  console.log("\nDownloaded models:\n");
  console.log(await client.system.listDownloadedModels());
  console.log("\n👉 For more, visit our documentation website at https://lmstudio.ai/docs/welcome\n");
}
main();
