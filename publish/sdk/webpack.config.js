const path = require("path");
const { experiments, optimize } = require("webpack");

const base = {
  entry: path.join(__dirname, "src", "index.ts"),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.join(__dirname, "tsconfig.json"),
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  externals: {
    "zod": "zod",
    "chalk": "chalk",
    "immer": "immer",
    "@lmstudio/lms-isomorphic": "@lmstudio/lms-isomorphic",
  },
  optimization: {
    minimize: false,
  },
};

module.exports = [
  {
    ...base,
    output: {
      filename: "index.js",
      path: path.join(__dirname, "dist"),
      libraryTarget: "commonjs2",
    },
  },
  {
    ...base,
    output: {
      filename: "index.mjs",
      path: path.join(__dirname, "dist"),
      library: {
        type: "module",
      },
    },
    experiments: {
      outputModule: true,
    },
  },
];
