const { nodeResolve } = require("@rollup/plugin-node-resolve");
const path = require("path");

module.exports = {
  input: path.join(__dirname, "ts-out", "index.js"),
  output: {
    file: path.join(__dirname, "dist", "index.esm.js"),
    format: "esm",
  },
  plugins: [
    nodeResolve({
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    }),
  ],
  external: ["process", "chalk", "@lmstudio/lms-isomorphic"],
};
