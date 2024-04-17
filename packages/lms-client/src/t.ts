import { LMStudioClient } from "./LMStudioClient";

async function main() {
  const client = new LMStudioClient();
  const model = await client.llm.load("TheBloke/phi-2-GGUF/phi-2.Q3_K_M.gguf");
  console.info(await client.system.listDownloadedModels());
}

main();
