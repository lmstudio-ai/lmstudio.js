import { LMStudioClient } from ".";

const client = new LMStudioClient();

async function main() {
  const model = await client.llm.get("test");
  console.info(
    await model.complete("Hello", {
      temperature: 1,
      maxPredictedTokens: 10,
    }),
  );
}

main();
