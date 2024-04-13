import { type LogLevel } from "@lmstudio/lms-shared-types";
import chalk from "chalk";
import { text, type TextAllowedTypes } from "./text";

/** @public */
export interface LoggerInterface {
  info(...messages: Array<unknown>): void;
  error(...messages: Array<unknown>): void;
  warn(...messages: Array<unknown>): void;
  debug(...messages: Array<unknown>): void;
}

const infoPrefix = chalk.greenBright("I");
const warnPrefix = chalk.yellowBright("W");
const errorPrefix = chalk.redBright("E");
const debugPrefix = chalk.blueBright("D");

export class SimpleLogger {
  private fullPrefix: string;
  private innerPrefix: string;
  private parentLogger: LoggerInterface;
  public constructor(prefixText: string = "", parentLogger: LoggerInterface = console) {
    if (parentLogger instanceof SimpleLogger) {
      if (prefixText === "") {
        this.innerPrefix = parentLogger.innerPrefix;
        this.fullPrefix = parentLogger.fullPrefix;
      } else {
        if (parentLogger.fullPrefix === "") {
          this.innerPrefix = prefixText;
        } else {
          this.innerPrefix = `${parentLogger.innerPrefix}][${prefixText}`;
        }
        this.fullPrefix = chalk.whiteBright(`[${this.innerPrefix}]`);
      }
      this.parentLogger = parentLogger.parentLogger;
    } else {
      if (prefixText === "") {
        this.innerPrefix = "";
        this.fullPrefix = "";
      } else {
        this.innerPrefix = prefixText;
        this.fullPrefix = chalk.whiteBright(`[${this.innerPrefix}]`);
      }
      this.parentLogger = parentLogger;
    }
  }
  public subclass(prefixText: string) {
    return new SimpleLogger(`${this.innerPrefix}:${prefixText}`, this.parentLogger);
  }
  public info(...messages: Array<unknown>) {
    this.parentLogger.info(infoPrefix, this.fullPrefix, ...messages);
  }
  public infoText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.info(text(strings, ...values));
  }
  public infoWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.info(...messages);
  }
  public error(...messages: Array<unknown>) {
    this.parentLogger.error(errorPrefix, this.fullPrefix, ...messages);
  }
  public errorText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.error(text(strings, ...values));
  }
  public errorWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.error(...messages);
  }
  public warn(...messages: Array<unknown>) {
    this.parentLogger.warn(warnPrefix, this.fullPrefix, ...messages);
  }
  public warnText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.warn(text(strings, ...values));
  }
  public warnWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.warn(...messages);
  }
  public debug(...messages: Array<unknown>) {
    this.parentLogger.debug(debugPrefix, this.fullPrefix, ...messages);
  }
  public debugText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.debug(text(strings, ...values));
  }
  public debugWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.debug(...messages);
  }
  public throw(message: string): never {
    throw new Error(`${this.fullPrefix} ${message}`);
  }
  public logAtLevel(level: LogLevel, ...messages: Array<unknown>) {
    switch (level) {
      case "debug":
        this.debug(...messages);
        break;
      case "info":
        this.info(...messages);
        break;
      case "warn":
        this.warn(...messages);
        break;
      case "error":
        this.error(...messages);
        break;
    }
  }
}
