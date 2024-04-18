// We don't ship sourcemaps, so we will remove those comments to prevent error messages

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "dist/index.js");
const content = fs.readFileSync(filePath, "utf8");
const newContent = content.replace(/\/\/# sourceMappingURL=.*\.js\.map/g, "//");
fs.writeFileSync(filePath, newContent, "utf8");
