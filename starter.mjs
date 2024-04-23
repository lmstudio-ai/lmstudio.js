import { spawn } from "child_process";
import inquirer from "inquirer";

const { commands } = await inquirer.prompt({
  type: "checkbox",
  name: "commands",
  message: "Which services would you like to use?",
  choices: [
    {
      checked: true,
      value: '"npm run watch-tsc"',
      name: "TypeScript Compilation (for regular packages)",
    },
    {
      checked: true,
      value: '"npm run watch-jest"',
      name: "Jest (unit tests)",
    },
    {
      checked: true,
      value: '[ "npm run watch-sdk-ae" : "npm run watch-sdk-webpack" ]',
      name: "SDK (in /publish/lmstudio)",
    },
    {
      checked: false,
      value: '[ "npm run watch-cli-package" : "npm run watch-cli-webpack" ]',
      name: "CLI (in /packages/lms-cli and in /publish/cli)",
    },
    {
      checked: false,
      value: '"npm run watch-lmstudio"',
      name: "LM Studio Installer (in /publish/lmstudio)",
    },
  ],
});

// Yes, it is dangerous to do command concatenation without proper escaping. But in this case, we
// have full control over the commands. We are not using any user input to build the command.
const command = `npx stmux -e "(?:error TS| failed\\, )" -- [ ${commands.join(" .. ")} ]`;
const sp = spawn(command, { shell: true, stdio: "inherit" });

sp.on("exit", () => {
  console.info("Processes terminated. The command ran was:");
  console.info(command);
});
