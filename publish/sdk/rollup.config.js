const { nodeResolve } = require("@rollup/plugin-node-resolve");
const path = require("path");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");

module.exports = {
  input: path.join(__dirname, "ts-out", "index.js"),
  output: [
    {
      file: path.join(__dirname, "dist", "index.mjs"),
      format: "esm",
    },
    {
      file: path.join(__dirname, "dist", "index.cjs"),
      format: "cjs",
    },
  ],
  context: "globalThis",
  plugins: [
    nodeResolve({
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    }),
    commonjs(),
    json(),
  ],
  external: ["process", "chalk", "zod", "zod-to-json-schema", "@lmstudio/lms-isomorphic"],
};
