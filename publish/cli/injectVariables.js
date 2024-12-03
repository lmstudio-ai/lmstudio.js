// Inject the current version by replacing the magic string <LMS-CLI-CURRENT-VERSION>
// This is much faster than rollup-plugin-replace

const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const content = readFileSync(join(__dirname, "dist", "index.js"), "utf-8");
const packageJson = readFileSync(join(__dirname, "package.json"), "utf-8");
const lmsKey = readFileSync(join(__dirname, "lms-key"), "utf-8").trim();

const replaced = content
  .replaceAll("<LMS-CLI-CURRENT-VERSION>", JSON.parse(packageJson).version)
  .replaceAll("<LMS-CLI-LMS-KEY>", lmsKey);

writeFileSync(join(__dirname, "dist", "index.js"), replaced, "utf-8");
