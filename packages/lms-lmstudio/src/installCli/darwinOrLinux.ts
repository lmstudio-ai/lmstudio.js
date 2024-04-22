import { text } from "@lmstudio/lms-common";
import { makeTitledPrettyError } from "@lmstudio/lms-common/dist/makePrettyError";
import boxen from "boxen";
import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";

interface ShellInstallationInfo {
  shellName: string;
  configFileName: string;
  commandToAddPath: string;
}

const shellInstallationInfo: Array<ShellInstallationInfo> = [
  {
    shellName: "sh",
    configFileName: ".profile",
    commandToAddPath: "echo 'export PATH=\"$PATH:<TARGET>\"' >> ~/.profile",
  },
  {
    shellName: "bash",
    configFileName: ".bashrc",
    commandToAddPath: "echo 'export PATH=\"$PATH:<TARGET>\"' >> ~/.bashrc",
  },
  {
    shellName: "zsh",
    configFileName: ".zshrc",
    commandToAddPath: "echo 'export PATH=\"$PATH:<TARGET>\"' >> ~/.zshrc",
  },
  {
    shellName: "fish",
    configFileName: ".config/fish/config.fish",
    commandToAddPath: "echo 'set -gx PATH $PATH <TARGET>' >> ~/.config/fish/config.fish",
  },
  {
    shellName: "csh",
    configFileName: ".cshrc",
    commandToAddPath: "echo 'setenv PATH \"$PATH:<TARGET>\"' >> ~/.cshrc",
  },
  {
    shellName: "tcsh",
    configFileName: ".tcshrc",
    commandToAddPath: "echo 'setenv PATH \"$PATH:<TARGET>\"' >> ~/.tcshrc",
  },
];

export async function installCliDarwinOrLinux(path: string) {
  const detectedShells: Array<ShellInstallationInfo> = [];
  const detectedAlreadyInstalledShells: Array<ShellInstallationInfo> = [];
  for (const shell of shellInstallationInfo) {
    const configPath = join(os.homedir(), shell.configFileName);
    try {
      await access(configPath);
    } catch (e) {
      continue;
    }
    const content = await readFile(configPath, { encoding: "utf8" });
    if (content.includes(path)) {
      detectedAlreadyInstalledShells.push(shell);
    } else {
      detectedShells.push(shell);
    }
  }

  if (detectedShells.length === 0) {
    if (detectedAlreadyInstalledShells.length === 0) {
      throw makeTitledPrettyError(
        "Unable to find any shell configuration files",
        text`
          We couldn't find any shell configuration file in your home directory.

          To complete the installation manually, please try to add the following directory to the
          PATH environment variable:

              ${chalk.yellowBright(path)}
        `,
      );
    } else {
      throw makeTitledPrettyError(
        "LM Studio CLI tool (lms) is already installed",
        text`
          LM Studio CLI tool is already installed for the following shells:

          ${detectedAlreadyInstalledShells
            .map(shell =>
              chalk.cyanBright(
                `    · ${shell.shellName} ${chalk.gray(`(~/${shell.configFileName})`)})`,
              ),
            )
            .join("\n")}

          If your shell is not listed above, please try to add the following directory to the PATH
          environment variable:

              ${chalk.yellowBright(path)}

            ${chalk.gray(text`
              (i) If you are having trouble running the CLI tool, please try to restart your
              terminal.
            `)}

            ${chalk.gray(text`
              (i) If you are using an integrated terminal in an editor (such as VS Code), please try
              to restart the editor.
            `)}
        `,
      );
    }
  }

  const commandsToRun: Array<string> = [];
  const commandsToRunFormatted: Array<string> = [];

  for (const shell of detectedShells) {
    const command = shell.commandToAddPath.replace("<TARGET>", path);
    commandsToRun.push(command);
    commandsToRunFormatted.push(`    ${command} ${chalk.gray(`# for ${shell.shellName}`)}`);
  }

  console.info(
    boxen(
      text`
        We are about to run the following commands to install the LM Studio CLI tool
        (lms).

        ${chalk.cyanBright(commandsToRunFormatted.join("\n"))}

        It will add the path ${chalk.greenBright(path)} to the PATH environment variable.
      `,
      { padding: 1, margin: 1, title: "CLI Tool Installation", borderColor: "greenBright" },
    ),
  );

  const { cont } = await inquirer.prompt([
    {
      type: "confirm",
      name: "cont",
      message: chalk.yellowBright("Do you want to continue?"),
      default: false,
    },
  ]);

  if (!cont) {
    console.info(chalk.greenBright("Installation aborted. No changes were made."));
    return;
  }

  execSync(commandsToRun.join(" && "));

  console.info(
    boxen(
      text`
        The LM Studio CLI tool (lms) has been successfully installed. You can run it with the
        command ${chalk.cyanBright("lms")}.

          ${chalk.gray(text`
            (i) You need to restart your terminal to start using the CLI tool.
          `)}

          ${chalk.gray(text`
            (i) If you are using an integrated terminal in an editor (such as VS Code), please try
            to restart the editor.
          `)}
      `,
      { padding: 1, margin: 1, title: "CLI Tool Installation", borderColor: "greenBright" },
    ),
  );
}
