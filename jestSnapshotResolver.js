const path = require("path");

module.exports = {
  resolveSnapshotPath: testPath =>
    path.join(
      path.join(path.dirname(testPath), ".test-snapshots"),
      path.basename(testPath) + ".snap",
    ),

  resolveTestPath: snapshotPath =>
    path.resolve(path.dirname(snapshotPath), "..", path.basename(snapshotPath, ".snap")),

  testPathForConsistencyCheck: path.resolve("consistency_check", "__tests__", "example.test.js"),
};
