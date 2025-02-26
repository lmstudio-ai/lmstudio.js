import { Chat, type LLM, LMStudioClient } from "../index.js";
import { ensureHeavyTestsEnvironment, llmTestingModel } from "../shared.heavy.test.js";

describe("LLM", () => {
  let client: LMStudioClient;
  let model: LLM;
  beforeAll(async () => {
    client = new LMStudioClient();
    await ensureHeavyTestsEnvironment(client);
  });
  beforeEach(async () => {
    model = await client.llm.model(llmTestingModel, { verbose: false });
  });
  it("can apply prompt template to a regular chat", async () => {
    const chat = Chat.from([
      { role: "system", content: "This is the system prompt." },
      { role: "user", content: "User message 1" },
      { role: "assistant", content: "Assistant message 1" },
      { role: "user", content: "User message 2" },
    ]);
    const formatted = await model.applyPromptTemplate(chat);
    expect(formatted).toMatchSnapshot();
  });
  it("can get model context length", async () => {
    const contextLength = await model.getContextLength();
    expect(contextLength).toMatchInlineSnapshot(`4096`);
  });
  it("can get model info", async () => {
    const modelInfo = await model.getModelInfo();
    expect(modelInfo).toMatchSnapshot({
      identifier: expect.any(String),
      instanceReference: expect.any(String),
      modelKey: expect.any(String),
    });
  });
  describe(".complete", () => {
    it("should work without streaming", async () => {
      const result = await model.complete("1 + 1 = 2; 2 + 2 = ", {
        temperature: 0,
        maxTokens: 3,
        stopStrings: [";"],
      });
      expect(result.content).toEqual("4");
      expect(result.stats).toMatchSnapshot({
        numGpuLayers: expect.any(Number),
        timeToFirstTokenSec: expect.any(Number),
        tokensPerSecond: expect.any(Number),
      });
      expect(result.modelInfo).toMatchSnapshot({
        identifier: expect.any(String),
        instanceReference: expect.any(String),
        modelKey: expect.any(String),
      });
      expect(result.roundIndex).toEqual(0);
    });
    it("should work with streaming", async () => {
      const prediction = model.complete("1 + 1 = 2; 2 + 2 = ", {
        temperature: 0,
        maxTokens: 3,
        stopStrings: [";"],
      });
      const fragments = [];
      for await (const fragment of prediction) {
        fragments.push(fragment);
      }
      expect(fragments).toMatchSnapshot();
      const result = await prediction.result();
      expect(result.content).toEqual("4");
      expect(result.stats).toMatchSnapshot({
        numGpuLayers: expect.any(Number),
        timeToFirstTokenSec: expect.any(Number),
        tokensPerSecond: expect.any(Number),
      });
      expect(result.modelInfo).toMatchSnapshot({
        identifier: expect.any(String),
        instanceReference: expect.any(String),
        modelKey: expect.any(String),
      });
    });
    it("should allow cancel via .cancel()", async () => {
      const prediction = model.complete("1 + 1 = 2; 2 + 2 = ", {
        temperature: 0,
        maxTokens: 50,
      });
      prediction.cancel();
      const result = await prediction.result();
      expect(result.stats.stopReason).toEqual("userStopped");
    });
  });
});
