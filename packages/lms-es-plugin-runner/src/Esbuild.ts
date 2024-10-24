import { text } from "@lmstudio/lms-common";
import { spawn } from "child_process";
import { access } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export class Esbuild {
  private readonly path: string;
  public constructor() {
    this.path = join(
      homedir(),
      ".cache",
      "lm-studio",
      ".internal",
      "utils",
      process.platform === "win32" ? "esbuild.exe" : "esbuild",
    );
  }
  public async check() {
    try {
      access(this.path);
    } catch {
      throw new Error(text`
        Cannot locate required dependencies (esbuild). Please make sure you have the latest version
        of LM Studio installed.
      `);
    }
  }
  public spawn(args: Array<string>) {
    return spawn(this.path, args);
  }
  public exec(args: Array<string>) {
    const childProcess = this.spawn(args);
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
    return new Promise<void>((resolve, reject) => {
      childProcess.on("exit", code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(text`esbuild failed with code ${code ?? "unknown"}`));
        }
      });
    });
  }
}
