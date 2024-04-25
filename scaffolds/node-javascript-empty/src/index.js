const { LMStudioClient } = require("@lmstudio/sdk");

async function main() {
  const client = new LMStudioClient();
  console.log(await client.system.listDownloadedModels());
}
main();
