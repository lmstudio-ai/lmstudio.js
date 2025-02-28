import { LMStudioClient, type EmbeddingModel } from "../index.js";
import { embeddingTestingNomic, ensureHeavyTestsEnvironment } from "../shared.heavy.test.js";

describe("EmbeddingModel", () => {
  let client: LMStudioClient;
  let model: EmbeddingModel;
  beforeAll(async () => {
    client = new LMStudioClient();
    await ensureHeavyTestsEnvironment(client);
  });
  beforeEach(async () => {
    model = await client.embedding.model(embeddingTestingNomic, { verbose: false });
  }, 60_000);
  it("can embed a single string", async () => {
    const result = await model.embed("Chaos is a ladder.");
    expect(result.embedding.length).toMatchInlineSnapshot(`768`);
    expect(result.embedding[0]).toBeCloseTo(0.0375, 1);
  });
  it("can embed multiple strings", async () => {
    const result = await model.embed([
      "Chaos is a ladder.",
      "Two chaoses are two ladders.",
      "Three chaoses are three ladders.",
    ]);
    expect(result.length).toBe(3);
    expect(result[0].embedding.length).toMatchInlineSnapshot(`768`);
    expect(result[0].embedding[0]).toBeCloseTo(0.0375, 1);
    expect(result[1].embedding.length).toMatchInlineSnapshot(`768`);
    expect(result[1].embedding[0]).toBeCloseTo(0.0076, 1);
    expect(result[2].embedding.length).toMatchInlineSnapshot(`768`);
    expect(result[2].embedding[0]).toBeCloseTo(0.0088, 1);
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
  it("Can tokenize correctly", async () => {
    const tokens = await model.tokenize("Chaos is a ladder.");
    expect(tokens).toMatchSnapshot();
  });
  it("Can tokenize multiple strings correctly", async () => {
    const tokens = await model.tokenize([
      "Cersei understands the consequences of her absence",
      "and she is absent anyway",
    ]);
    expect(tokens).toMatchSnapshot();
  });
  it("Can count tokens correctly", async () => {
    const tokenCount = await model.countTokens("Chaos is a ladder.");
    expect(tokenCount).toMatchInlineSnapshot(`5`);
  });
  it("Has correct properties", async () => {
    expect(model.displayName).toMatchInlineSnapshot(`"Nomic Embed Text v1.5"`);
    expect(model.format).toMatchInlineSnapshot(`"gguf"`);
    expect(model.identifier).toEqual(embeddingTestingNomic);
    expect(model.path).toEqual(embeddingTestingNomic);
    expect(model.sizeBytes).toMatchInlineSnapshot(`84106624`);
  });
});
