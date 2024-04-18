import boxen from "boxen";
import chalk from "chalk";
import { changeErrorStackInPlace } from "./errorStack";

export function makePrettyError(content: string, stack?: string) {
  if ((process as any).browser) {
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
