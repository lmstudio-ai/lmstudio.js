import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();

await printDownloadedModels();
await printLoadedModels();
await predictWithAnyModel();

// ---------- Functions ----------

async function printDownloadedModels() {
  const downloadedModels = await client.system.listDownloadedModels();
  console.log("Downloaded Models:");
  if (downloadedModels.length === 0) {
    console.log("    No models downloaded. Get some in LM Studio.");
    process.exit(0);
  }

  // Limit to printing 5 models
  for (const model of downloadedModels.slice(0, 5)) {
    console.log(`  - ${model.modelKey} (${model.displayName})`);
  }
  if (downloadedModels.length > 5) {
    console.log(`    (... and ${downloadedModels.length - 5} more)`);
  }
  console.log(); // Create an empty line
}

async function printLoadedModels() {
  const loadedLLMs = await client.llm.listLoaded();
  console.log("Loaded Models:");
  if (loadedLLMs.length === 0) {
    console.log("    You don't have any models loaded. (Run `lms load` to load a model)");
    process.exit(0);
  }
  for (const model of loadedLLMs) {
    console.log(`  - ${model.identifier} (${model.displayName})`);
  }
  console.log(); // Create an empty line
}

async function predictWithAnyModel() {
  const model = await client.llm.model();
  const prompt = "The meaning of life is";
  const prediction = model.complete(prompt, {
    maxTokens: 100,
    temperature: 0.7,
  });
  process.stdout.write(prompt); // Print the prompt
  // Stream the prediction text to console
  for await (const { content } of prediction) {
    process.stdout.write(content);
  }
  const { stats } = await prediction.result();
  console.log("\n\nPrediction Stats:", stats);
}
