const path = require("path");
const { ProvidePlugin } = require("webpack");

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
    "immer": "immer",
    "@lmstudio/lms-isomorphic": "@lmstudio/lms-isomorphic",
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    // fix "process is not defined" error:
    new ProvidePlugin({
      process: "process/browser",
    }),
  ],
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
