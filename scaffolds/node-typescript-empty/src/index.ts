import { LMStudioClient } from "@lmstudio/sdk";

async function main() {
  const client = new LMStudioClient();
  console.log(await client.system.listDownloadedModels());
}
main();
