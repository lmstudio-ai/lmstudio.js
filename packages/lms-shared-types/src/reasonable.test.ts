import { reasonableKeyStringSchema } from "./reasonable.js";

describe("reasonableKeyStringSchema", () => {
  it("should allow strings between 1 and 1024 characters", () => {
    expect(reasonableKeyStringSchema.safeParse("a").success).toBe(true);
    expect(reasonableKeyStringSchema.safeParse("a".repeat(1024)).success).toBe(true);
  });

  it("should not allow empty strings", () => {
    expect(reasonableKeyStringSchema.safeParse("").success).toBe(false);
  });

  it("should not allow strings longer than 1024 characters", () => {
    expect(reasonableKeyStringSchema.safeParse("a".repeat(1025)).success).toBe(false);
  });

  it('should not allow string "__proto__"', () => {
    expect(reasonableKeyStringSchema.safeParse("__proto__").success).toBe(false);
  });

  it("should not allow strings with control characters", () => {
    expect(reasonableKeyStringSchema.safeParse("\u0000").success).toBe(false);
    expect(reasonableKeyStringSchema.safeParse("\n").success).toBe(false);
    expect(reasonableKeyStringSchema.safeParse("\t").success).toBe(false);
  });
});
