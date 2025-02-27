import { LMStudioClient } from "./index.js";

/**
 * Use fully specified (ugly) path to ensure that the correct model is used.
 *
 * If you are reading this code and want to use this model yourself, you should just do
 * "qwen2.5-0.5b-instruct@q4_k_m" instead.
 */
export const llmTestingModel =
  "lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf";

export const llmTestingSDMainModel =
  "lmstudio-community/Qwen2.5-3B-Instruct-GGUF/Qwen2.5-3B-Instruct-Q4_K_M.gguf";

export async function ensureHeavyTestsEnvironment(client?: LMStudioClient) {
  client = client ?? new LMStudioClient();
  const models = await client.system.listDownloadedModels();

  if (!models.some(model => model.path === llmTestingModel)) {
    throw new Error(
      `Running heavy tests requires the model ${llmTestingModel}.` +
        `Use "lms get qwen2.5-0.5b@q4_k_m" to download it.`,
    );
  }

  if (!models.some(model => model.path === llmTestingSDMainModel)) {
    throw new Error(
      `Running heavy tests requires the model ${llmTestingSDMainModel}.` +
        `Use "lms get lmstudio-community/Qwen2.5-3B-Instruct-GGUF@q4_k_m" to download it.`,
    );
  }
}

test("Ensure heavy tests environment", async () => {
  await ensureHeavyTestsEnvironment();
});
