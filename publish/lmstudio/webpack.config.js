const path = require("path");

module.exports = [
  {
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
    target: "node",
    output: {
      filename: "index.js",
      path: path.join(__dirname, "dist"),
      libraryTarget: "commonjs2",
    },
  },
];
