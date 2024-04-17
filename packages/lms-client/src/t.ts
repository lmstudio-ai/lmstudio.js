import { LMStudioClient } from "./LMStudioClient";

async function main() {
  const client = new LMStudioClient();
  console.info(await client.system.listDownloadedModels());
}

main();
