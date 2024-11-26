import { removeUndefinedValues } from "./removeUndefinedValues.js";

describe("removeUndefinedValues function", () => {
  it("should remove properties with undefined values", () => {
    const obj = { a: 1, b: undefined, c: "test" };
    const result = removeUndefinedValues(obj);
    expect(result).toEqual({ a: 1, c: "test" });
    expect(Object.prototype.hasOwnProperty.call(result, "b")).toBe(false);
  });

  it("should return an empty object if all properties are undefined", () => {
    const obj = { a: undefined, b: undefined, c: undefined };
    const result = removeUndefinedValues(obj);
    expect(result).toEqual({});
    expect(Object.keys(result).length).toBe(0);
  });

  it("should return the same object if there are no undefined values", () => {
    const obj = { a: 1, b: 2, c: "test" };
    const result = removeUndefinedValues(obj);
    expect(result).toEqual(obj);
  });

  it("should not mutate the original object", () => {
    const obj = { a: 1, b: undefined, c: "test" };
    const copy = { ...obj };
    removeUndefinedValues(obj);
    expect(obj).toEqual(copy);
  });

  it("should not be susceptible to prototype pollution", () => {
    const obj = { a: 1, b: undefined, c: "test", __proto__: { d: 4 } };
    const result = removeUndefinedValues(obj);
    expect((result as any).d).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result, "d")).toBe(false);
  });
});
