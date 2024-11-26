/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  watchPathIgnorePatterns: ["\\.git", "node_modules"],
  resolver: "jest-ts-webcompat-resolver",
};
