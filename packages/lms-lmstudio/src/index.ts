import { makeTitledPrettyError } from "@lmstudio/lms-common";
import chalk from "chalk";
import { installCli } from "./installCli/index.js";

async function main() {
  if (process.argv.length !== 3 && process.argv[2] !== "install-cli") {
    throw makeTitledPrettyError(
      "Invalid usage, only the following is supported:",
      `    ${chalk.yellowBright("npx lmstudio install-cli")}`,
    );
  }
  await installCli();
}

main().catch(e => {
  if (typeof e.message === "string") {
    console.error(e.message);
    return;
  }
  throw e;
});
