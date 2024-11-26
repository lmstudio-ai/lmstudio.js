import { makePromise } from "./makePromise.js";

describe("makePromise", () => {
  it("should resolve correctly", async () => {
    const { promise, resolve } = makePromise<number>();
    const testValue = 42;

    resolve(testValue);

    await expect(promise).resolves.toBe(testValue);
  });

  it("should reject correctly", async () => {
    const { promise, reject } = makePromise<number>();
    const testError = new Error("test error");

    reject(testError);

    await expect(promise).rejects.toThrow(testError);
  });
});
