import { z, type ZodSchema } from "zod";
import { filteredArray } from "./zodHelpers"; // replace with your actual file path

describe("filteredArray", () => {
  it("should return an array with elements that match the provided schema", () => {
    // Define a ZodSchema for number
    const numberSchema: ZodSchema<number> = z.number();

    // Create a filtered array schema
    const filteredNumberArray = filteredArray(numberSchema);

    // Test data
    const data = [1, "2", 3, "4", 5];

    // Parse the data using the filtered array schema
    const result = filteredNumberArray.safeParse(data);

    // Expect the parse to be successful and only contains numbers
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 3, 5]);
    }
  });
});
