import { serializeError } from "@lmstudio/lms-shared-types";
import { z } from "zod";
import {
  createResultSchema,
  maybeErroredSchema,
  promiseToMaybeErrored,
  promiseToResult,
  unwrapPromiseOfMaybeErrored,
  unwrapPromiseOfResult,
  type MaybeErrored,
  type Result,
} from "./resultTypes";

describe("resultTypes", () => {
  describe("maybeErroredSchema", () => {
    it("should validate success object", () => {
      const data = { success: true };
      expect(maybeErroredSchema.safeParse(data).success).toBe(true);
    });

    it("should validate error object", () => {
      const data = { success: false, error: serializeError(new Error("Test error")) };
      expect(maybeErroredSchema.safeParse(data).success).toBe(true);
    });

    it("should not validate invalid object", () => {
      const data = { success: "invalid" };
      expect(maybeErroredSchema.safeParse(data).success).toBe(false);
    });
  });

  describe("promiseToMaybeErrored", () => {
    it("should return success object for resolved promise", async () => {
      const promise = Promise.resolve();
      const result = await promiseToMaybeErrored(promise);
      expect(result.success).toBe(true);
    });

    it("should return error object for rejected promise", async () => {
      const promise = Promise.reject(new Error("Test error"));
      const result = await promiseToMaybeErrored(promise);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.title).toBe("Test error");
      }
    });
  });

  describe("unwrapPromiseOfMaybeErrored", () => {
    it("should resolve for success object", async () => {
      const promise = Promise.resolve({ success: true } satisfies MaybeErrored);
      await expect(unwrapPromiseOfMaybeErrored(promise)).resolves.toBeUndefined();
    });

    it("should reject for error object", async () => {
      const promise = Promise.resolve({
        success: false,
        error: serializeError(new Error("Test error")),
      });
      await expect(unwrapPromiseOfMaybeErrored(promise)).rejects.toThrow("Test error");
    });
  });

  describe("createResultSchema", () => {
    it("should create a valid schema", () => {
      const schema = createResultSchema(z.string());
      const data = { success: true, result: "test" };
      expect(schema.safeParse(data).success).toBe(true);
    });
  });

  describe("promiseToResult", () => {
    it("should return success object for resolved promise", async () => {
      const promise = Promise.resolve("test");
      const result = await promiseToResult(promise);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result).toBe("test");
      }
    });

    it("should return error object for rejected promise", async () => {
      const promise = Promise.reject(new Error("Test error"));
      const result = await promiseToResult(promise);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.title).toBe("Test error");
      }
    });
  });

  describe("unwrapPromiseOfResult", () => {
    it("should resolve for success object", async () => {
      const promise = Promise.resolve({ success: true, result: "test" } satisfies Result<string>);
      await expect(unwrapPromiseOfResult(promise)).resolves.toBe("test");
    });

    it("should reject for error object", async () => {
      const promise = Promise.resolve({
        success: false,
        error: serializeError(new Error("Test error")),
      } satisfies Result<string>);
      await expect(unwrapPromiseOfResult(promise)).rejects.toThrow("Test error");
    });
  });
});
