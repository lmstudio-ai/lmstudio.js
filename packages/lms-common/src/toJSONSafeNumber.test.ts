import { toJSONSafeNumber } from "./toJSONSafeNumber";

describe("toJSONSafeNumber", () => {
  it("should return undefined when the input is not a finite number", () => {
    expect(toJSONSafeNumber(Infinity)).toBeUndefined();
    expect(toJSONSafeNumber(-Infinity)).toBeUndefined();
  });

  it("should return undefined when the input is NaN", () => {
    expect(toJSONSafeNumber(NaN)).toBeUndefined();
  });

  it("should return the input when it is a finite number and not NaN", () => {
    expect(toJSONSafeNumber(123)).toBe(123);
    expect(toJSONSafeNumber(-123)).toBe(-123);
    expect(toJSONSafeNumber(0)).toBe(0);
  });
});
