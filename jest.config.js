module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testEnvironment: "node",
  snapshotResolver: "./jestSnapshotResolver.js",
  collectCoverage: true,
  watchPathIgnorePatterns: ["\\.git", "node_modules"],
  resolver: "jest-ts-webcompat-resolver",
};
