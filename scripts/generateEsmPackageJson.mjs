// In order for node.js to correctly recognize the esm folder in dist is an ES module, we need to
// generate and place a "package.json" with { "type": "module" } in each of the packages that have
// esm support

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const packagesFolder = resolve("../packages");

for (const dirent of readdirSync(packagesFolder, { withFileTypes: true })) {
  if (!dirent.isDirectory()) {
    continue;
  }
  if (!dirent.name.startsWith("lms-")) {
    continue;
  }
  const packageFolder = resolve(packagesFolder, dirent.name);
  const packageJson = JSON.parse(readFileSync(resolve(packageFolder, "package.json"), "utf-8"));
  const exports = packageJson.exports;
  if (typeof exports !== "object") {
    continue;
  }
  // If none of the exports have specified the "import" field, we don't need to generate a
  // package.json file
  if (Object.values(exports).every(value => !value || !value.import)) {
    continue;
  }
  const targetFolder = resolve(packageFolder, "dist", "esm");
  const targetPath = resolve(targetFolder, "package.json");
  if (existsSync(targetPath)) {
    continue;
  }
  mkdirSync(targetFolder, { recursive: true });
  writeFileSync(targetPath, JSON.stringify({ type: "module" }));
}
