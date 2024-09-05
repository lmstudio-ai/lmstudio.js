import { deepFreeze } from "./deepFreeze";

describe("deepFreeze", () => {
  it("should return non-objects as is", () => {
    expect(deepFreeze(123)).toBe(123);
    expect(deepFreeze("abc")).toBe("abc");
    expect(deepFreeze(undefined)).toBe(undefined);
    expect(deepFreeze(null)).toBe(null);
  });

  it("should freeze an object", () => {
    const obj = { a: 1, b: 2 };
    const result = deepFreeze(obj);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("should not affect already frozen objects", () => {
    const obj = Object.freeze({ a: 1, b: 2 });
    const result = deepFreeze(obj);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("should freeze nested objects", () => {
    const obj = { a: 1, b: { c: 3 } };
    const result = deepFreeze(obj);
    expect(Object.isFrozen(result.b)).toBe(true);
  });

  it("should freeze arrays", () => {
    const array = [1, 2, 3];
    const result = deepFreeze(array);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("should freeze objects within arrays", () => {
    const array = [1, { a: 2 }, 3];
    const result = deepFreeze(array);
    expect(Object.isFrozen(result[1])).toBe(true);
  });
});
