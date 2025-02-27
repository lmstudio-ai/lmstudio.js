import { LMStudioClient } from "./index.js";

/**
 * Use fully specified (ugly) path to ensure that the correct model is used.
 *
 * If you are reading this code and want to use this model yourself, you should just do
 * "qwen2.5-0.5b-instruct@q4_k_m" instead.
 */
export const llmTestingQwen05B =
  "lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf";

export const llmTestingQwen3B =
  "lmstudio-community/Qwen2.5-3B-Instruct-GGUF/Qwen2.5-3B-Instruct-Q4_K_M.gguf";

export const llmTestingQwenVL =
  "lmstudio-community/Qwen2-VL-2B-Instruct-GGUF/Qwen2-VL-2B-Instruct-Q4_K_M.gguf";

export const embeddingTestingNomic =
  "nomic-ai/nomic-embed-text-v1.5-GGUF/nomic-embed-text-v1.5.Q4_K_M.gguf";

export async function ensureHeavyTestsEnvironment(client?: LMStudioClient) {
  client = client ?? new LMStudioClient();
  const models = await client.system.listDownloadedModels();

  if (!models.some(model => model.path === llmTestingQwen05B)) {
    throw new Error(
      `Running heavy tests requires the model ${llmTestingQwen05B}.` +
        `Use "lms get qwen2.5-0.5b@q4_k_m" to download it.`,
    );
  }

  if (!models.some(model => model.path === llmTestingQwen3B)) {
    throw new Error(
      `Running heavy tests requires the model ${llmTestingQwen3B}.` +
        `Use "lms get lmstudio-community/Qwen2.5-3B-Instruct-GGUF@q4_k_m" to download it.`,
    );
  }

  if (!models.some(model => model.path === llmTestingQwenVL)) {
    throw new Error(
      `Running heavy tests requires the model ${llmTestingQwenVL}.` +
        `Use "lms get lmstudio-community/Qwen2-VL-2B-Instruct-GGUF@q4_k_m" to download it.`,
    );
  }

  if (!models.some(model => model.path === embeddingTestingNomic)) {
    throw new Error(
      `Running heavy tests requires the model ${embeddingTestingNomic}.` +
        `Use "lms get nomic-ai/nomic-embed-text-v1.5-gguf@q4_k_m" to download it.`,
    );
  }
}

test("Ensure heavy tests environment", async () => {
  await ensureHeavyTestsEnvironment();
});
