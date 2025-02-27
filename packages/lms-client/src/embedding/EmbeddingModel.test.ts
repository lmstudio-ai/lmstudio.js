import { LMStudioClient, type EmbeddingModel } from "../index.js";
import { embeddingTestingNomic, ensureHeavyTestsEnvironment } from "../shared.heavy.test";

describe("EmbeddingModel", () => {
  let client: LMStudioClient;
  let model: EmbeddingModel;
  beforeAll(async () => {
    client = new LMStudioClient();
    await ensureHeavyTestsEnvironment(client);
  });
  beforeEach(async () => {
    model = await client.embedding.model(embeddingTestingNomic, { verbose: false });
  });
  it("can embed a single string", async () => {
    const result = await model.embed("hello");
    expect(result.embedding.length).toMatchInlineSnapshot(`768`);
    expect(result.embedding[0]).toBeCloseTo(0.007399, 4);
  });
  it("can get model context length", async () => {
    const contextLength = await model.getContextLength();
    expect(contextLength).toMatchInlineSnapshot(`2048`);
  });
  it("can get model info", async () => {
    const modelInfo = await model.getModelInfo();
    expect(modelInfo).toMatchSnapshot({
      identifier: expect.any(String),
      instanceReference: expect.any(String),
      modelKey: expect.any(String),
    });
  });
});
