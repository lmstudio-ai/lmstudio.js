const path = require("path");

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
    mainFields: ["module", "main"],
    exportsFields: ["import", "require", "default"],
    extensions: [".tsx", ".ts", ".js"],
  },
  externals: {
    "process": "process",
    "chalk": "chalk",
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
];
