import { z } from "zod";
import { type LLM, LMStudioClient, tool } from "../index.js";
import { ensureHeavyTestsEnvironment, llmTestingQwen05B } from "../shared.heavy.test.js";

describe("LLM", () => {
  let client: LMStudioClient;
  let model: LLM;
  const addImplementation = jest.fn(({ a, b }) => a + b);
  const additionTool = tool({
    name: "add",
    description: "Add two numbers",
    parameters: { a: z.number(), b: z.number() },
    implementation: addImplementation,
  });
  beforeAll(async () => {
    client = new LMStudioClient();
    await ensureHeavyTestsEnvironment(client);
  });
  beforeEach(async () => {
    model = await client.llm.model(llmTestingQwen05B, { verbose: false });
  });
  it("should call the tool with the correct parameters", async () => {
    // There currently is a issue with temperature 0 + tool use. So this test does not work
    // reliably.
    await model.act("What is 1 + 2?", [additionTool], { temperature: 0 });
    expect(addImplementation).toHaveBeenCalledTimes(1);
    expect(addImplementation.mock.calls[0]).toEqual([{ a: 1, b: 2 }]);
  });
});
