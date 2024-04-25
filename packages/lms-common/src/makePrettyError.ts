import boxen from "boxen";
import chalk from "chalk";
import process from "process";
import { changeErrorStackInPlace } from "./errorStack";

export function makeTitledPrettyError(title: string, content: string, stack?: string) {
  return makePrettyError(chalk.bgRed.white(` ${title} `) + "\n\n" + content, stack);
}
export function makePrettyError(content: string, stack?: string) {
  if ((process as any).browser || process.env.LMS_NO_FANCY_ERRORS) {
    const error = new Error(content);
    if (stack === undefined) {
      changeErrorStackInPlace(error, "");
    } else {
      changeErrorStackInPlace(error, stack);
    }
    return error;
  } else {
    if (stack !== undefined) {
      content +=
        "\n\n\n " + chalk.bgWhite.black("  </> STACK TRACE  ") + "\n\n" + chalk.gray(stack);
    }
    const error = new Error(
      "\n" + boxen(content, { padding: 1, margin: 1, borderColor: "redBright", title: "Error" }),
    );
    changeErrorStackInPlace(error, "");
    return error;
  }
}
