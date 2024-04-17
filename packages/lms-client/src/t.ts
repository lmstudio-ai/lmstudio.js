import { LMStudioClient } from "./LMStudioClient";

async function main() {
  const client = new LMStudioClient({
    verboseErrorMessages: true,
  });
  const model = await client.llm.load("sd");
  console.info(await client.system.listDownloadedModels());
}

main();
