import { text } from "./text";

test("should throw if the lengths of the two arrays are wrong", () => {
  expect(() => {
    const templateStringsArray = Object.assign(["a", "b"], { raw: ["a", "b"] });
    text(templateStringsArray, "a", "b");
  }).toThrow();
  expect(() => {
    const templateStringsArray = Object.assign(["a", "b"], { raw: ["a", "b"] });
    text(templateStringsArray);
  }).toThrow();
  expect(() => {
    const templateStringsArray = Object.assign(["a", "b"], { raw: ["a", "b"] });
    text(templateStringsArray, "a");
  }).not.toThrow();
});

test("should work on empty strings", () => {
  expect(text``).toBe("");
});

test("should turn two or more new lines into two", () => {
  expect(text`a\n\nb`).toBe("a\n\nb");
  expect(text`a\n\n\nb`).toBe("a\n\nb");
  expect(text`a\n\n\n\nb`).toBe("a\n\nb");
});

test("should ignore leading new lines", () => {
  expect(text`\n\na`).toBe("a");
});

test("should ignore trailing new lines and whitespace", () => {
  expect(text`a\n\n  `).toBe("a");
});

test("should remove common indentation", () => {
  expect(text`  a\n\n  b`).toBe("a\n\nb");
  expect(text`  a\n\n    b`).toBe("a\n\n  b");
  expect(text`  a\n\n    b\n\n  c`).toBe("a\n\n  b\n\nc");
});

test("lines with only whitespace should be ignored", () => {
  expect(text`  a\n\n  \n\n  b`).toBe("a\n\nb");
  expect(text`  a\n\n \n\n  b`).toBe("a\n\nb");
});

test("should replace single newlines with a space", () => {
  expect(text`a\nb`).toBe("a b");
  expect(text`  a\n  b`).toBe("a b");
});

test("extra whitespace should be removed when replacing single newlines with a space", () => {
  expect(text`a\n  b`).toBe("a b");
  expect(text`  a   \n     b`).toBe("a b");
});

test("should work with string values", () => {
  expect(text`a${"b"}`).toBe("ab");
  expect(text`a${"b"}c`).toBe("abc");
  expect(text`${"a"}b`).toBe("ab");
  expect(text`${"a"}b${"c"}`).toBe("abc");
  expect(text`${"a"}${"b"}`).toBe("ab");
  expect(text`${"a"}\n${"b"}`).toBe("a b");
  expect(text`${"a"}\n\n${"b"}`).toBe("a\n\nb");
});

test("should work with number values", () => {
  expect(text`a${1}`).toBe("a1");
  expect(text`a${1}c`).toBe("a1c");
  expect(text`${1}b`).toBe("1b");
  expect(text`${1}b${2}`).toBe("1b2");
});

test("whitespace in variables should not count for indentation", () => {
  expect(text`  a\n\n ${" "}1234`).toBe(" a\n\n 1234");
});

test("Same template used twice with different number of args should throw", () => {
  const template = Object.assign(["a", "b"], { raw: ["a", "b"] });
  text(template, "a");
  expect(() => text(template, "a", "b")).toThrow();
});

test("stress Test", () => {
  expect(text`
    Hello, my name is ${"John Doe"}.


      This
      is
      a
      test.
        
    Number: ${1234}
  `).toBe("Hello, my name is John Doe.\n\n  This is a test.\n\nNumber: 1234");
});
