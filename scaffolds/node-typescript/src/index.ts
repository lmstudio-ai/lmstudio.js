import { LMStudioClient } from "@lmstudio/sdk";

async function main() {
  const client = new LMStudioClient();
  const model = client.llm.get({});
  const prediction = model.complete("The meaning of life is:", {
    config: { maxPredictedTokens: 100 },
  });
  for await (const text of prediction) {
    process.stdout.write(text);
  }
  console.info("\n\nPrediction Stats:", (await prediction).stats);
}
main();
