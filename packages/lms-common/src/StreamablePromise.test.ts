import { StreamablePromise } from "./StreamablePromise.js";

class TestStreamablePromise extends StreamablePromise<number, Array<number>> {
  protected collect(fragments: ReadonlyArray<number>): Promise<Array<number>> {
    return Promise.resolve(Array.from(fragments));
  }

  private constructor() {
    super();
  }

  public static create() {
    const streamablePromise = new TestStreamablePromise();
    const finished = (error?: any) => streamablePromise.finished(error);
    const push = (fragment: number) => streamablePromise.push(fragment);
    return { streamablePromise, finished, push };
  }
}

describe("StreamablePromise", () => {
  it("should resolve with collected fragments when finished without error", async () => {
    const { streamablePromise, finished, push } = TestStreamablePromise.create();
    push(1);
    push(2);
    push(3);
    finished();

    const result = await streamablePromise;
    expect(result).toEqual([1, 2, 3]);
  });

  it("should reject with error when finished with error", async () => {
    const { streamablePromise, finished } = TestStreamablePromise.create();
    const error = new Error("Test error");
    finished(error);

    await expect(streamablePromise).rejects.toThrow("Test error");
  });

  it("should throw error when push called after finished", () => {
    const { finished, push } = TestStreamablePromise.create();
    finished();

    expect(() => push(1)).toThrow("`push` called while not pending");
  });

  it("should throw error when finished called more than once", () => {
    const { finished } = TestStreamablePromise.create();
    finished();

    expect(() => finished()).toThrow("`finished` called while not pending");
  });

  it("should be iterable and yield fragments in order", async () => {
    const { streamablePromise, push, finished } = TestStreamablePromise.create();
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      push(1);
      await new Promise(resolve => setTimeout(resolve, 0));
      push(2);
      await new Promise(resolve => setTimeout(resolve, 0));
      push(3);
      await new Promise(resolve => setTimeout(resolve, 0));
      finished();
    })();

    const fragments: number[] = [];
    for await (const fragment of streamablePromise) {
      fragments.push(fragment);
    }

    expect(fragments).toEqual([1, 2, 3]);
  });

  it("should throw an error during iteration", async () => {
    const { streamablePromise, push, finished } = TestStreamablePromise.create();
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      push(1);
      await new Promise(resolve => setTimeout(resolve, 0));
      finished(new Error("Test error"));
    })();

    const fragments: number[] = [];
    try {
      for await (const fragment of streamablePromise) {
        fragments.push(fragment);
      }
    } catch (err: any) {
      expect(err.message).toBe("Test error");
    }

    expect(fragments).toEqual([1]);
  });
});
