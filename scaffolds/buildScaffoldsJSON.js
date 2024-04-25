const { readdirSync, statSync, writeFileSync } = require("fs");

const names = readdirSync(__dirname);
const output = [];
for (const name of names) {
  const stat = statSync(name);
  if (stat.isDirectory() && !name.startsWith(".")) {
    const metadata = require(`./${name}/lms-scaffold.json`);
    output.push(metadata);
  }
}
writeFileSync("scaffolds.json", JSON.stringify(output, null, 2));
