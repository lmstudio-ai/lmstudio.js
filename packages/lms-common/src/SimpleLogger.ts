import { type LogLevel } from "@lmstudio/lms-shared-types";
import chalk from "chalk";
import { text, type TextAllowedTypes } from "./text.js";

/** @public */
export interface LoggerInterface {
  info(...messages: Array<unknown>): void;
  error(...messages: Array<unknown>): void;
  warn(...messages: Array<unknown>): void;
  debug(...messages: Array<unknown>): void;
}

function isSimpleLogger(logger: LoggerInterface): logger is SimpleLogger {
  return (logger as any)?.isSimpleLogger === true;
}

export interface SimpleLoggerConstructorOpts {
  useLogLevelPrefixes?: boolean;
  infoPrefix?: string | null;
  warnPrefix?: string | null;
  errorPrefix?: string | null;
  debugPrefix?: string | null;
}

const defaultInfoPrefix = chalk.greenBright("I");
const defaultWarnPrefix = chalk.yellowBright("W");
const defaultErrorPrefix = chalk.redBright("E");
const defaultDebugPrefix = chalk.blueBright("D");

export class SimpleLogger {
  public readonly isSimpleLogger = true;
  private readonly fullPrefix: string;
  private readonly innerPrefix: string;
  private readonly parentLogger: LoggerInterface;
  private readonly infoPrefix: Array<string> = [];
  private readonly warnPrefix: Array<string> = [];
  private readonly errorPrefix: Array<string> = [];
  private readonly debugPrefix: Array<string> = [];
  private readonly opts: Required<SimpleLoggerConstructorOpts>;

  public constructor(
    prefixText: string = "",
    parentLogger: LoggerInterface = console,
    {
      useLogLevelPrefixes,
      infoPrefix,
      warnPrefix,
      errorPrefix,
      debugPrefix,
    }: SimpleLoggerConstructorOpts = {},
  ) {
    if (isSimpleLogger(parentLogger)) {
      useLogLevelPrefixes = useLogLevelPrefixes ?? parentLogger.opts.useLogLevelPrefixes;
      infoPrefix = infoPrefix === undefined ? parentLogger.opts.infoPrefix : infoPrefix;
      warnPrefix = warnPrefix === undefined ? parentLogger.opts.warnPrefix : warnPrefix;
      errorPrefix = errorPrefix === undefined ? parentLogger.opts.errorPrefix : errorPrefix;
      debugPrefix = debugPrefix === undefined ? parentLogger.opts.debugPrefix : debugPrefix;

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
      useLogLevelPrefixes = useLogLevelPrefixes ?? false;
      infoPrefix = infoPrefix === undefined ? defaultInfoPrefix : infoPrefix;
      warnPrefix = warnPrefix === undefined ? defaultWarnPrefix : warnPrefix;
      errorPrefix = errorPrefix === undefined ? defaultErrorPrefix : errorPrefix;
      debugPrefix = debugPrefix === undefined ? defaultDebugPrefix : debugPrefix;

      if (prefixText === "") {
        this.innerPrefix = "";
        this.fullPrefix = "";
      } else {
        this.innerPrefix = prefixText;
        this.fullPrefix = chalk.whiteBright(`[${this.innerPrefix}]`);
      }
      this.parentLogger = parentLogger;
    }
    if (useLogLevelPrefixes) {
      if (infoPrefix !== null) {
        this.infoPrefix.push(infoPrefix);
      }
      if (warnPrefix !== null) {
        this.warnPrefix.push(warnPrefix);
      }
      if (errorPrefix !== null) {
        this.errorPrefix.push(errorPrefix);
      }
      if (debugPrefix !== null) {
        this.debugPrefix.push(debugPrefix);
      }
    }
    if (this.fullPrefix !== "") {
      this.infoPrefix.push(this.fullPrefix);
      this.warnPrefix.push(this.fullPrefix);
      this.errorPrefix.push(this.fullPrefix);
      this.debugPrefix.push(this.fullPrefix);
    }
    this.opts = {
      useLogLevelPrefixes,
      infoPrefix,
      warnPrefix,
      errorPrefix,
      debugPrefix,
    };
  }
  public subclass(prefixText: string) {
    return new SimpleLogger(`${this.innerPrefix}:${prefixText}`, this.parentLogger);
  }
  public info(...messages: Array<unknown>) {
    this.parentLogger.info(...this.infoPrefix, ...messages);
  }
  public infoText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.info(text(strings, ...values));
  }
  public infoWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.info(...messages);
  }
  public error(...messages: Array<unknown>) {
    this.parentLogger.error(...this.errorPrefix, ...messages);
  }
  public errorText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.error(text(strings, ...values));
  }
  public errorWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.error(...messages);
  }
  public warn(...messages: Array<unknown>) {
    this.parentLogger.warn(...this.warnPrefix, ...messages);
  }
  public warnText(strings: TemplateStringsArray, ...values: Array<TextAllowedTypes>) {
    this.warn(text(strings, ...values));
  }
  public warnWithoutPrefix(...messages: Array<unknown>) {
    this.parentLogger.warn(...messages);
  }
  public debug(...messages: Array<unknown>) {
    this.parentLogger.debug(...this.debugPrefix, ...messages);
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
  public static fromMultiple(
    loggers: Array<LoggerInterface>,
    opts?: SimpleLoggerConstructorOpts,
  ): SimpleLogger {
    return new SimpleLogger(
      "",
      {
        debug: (...messages) => {
          for (const logger of loggers) {
            logger.debug(...messages);
          }
        },
        info: (...messages) => {
          for (const logger of loggers) {
            logger.info(...messages);
          }
        },
        warn: (...messages) => {
          for (const logger of loggers) {
            logger.warn(...messages);
          }
        },
        error: (...messages) => {
          for (const logger of loggers) {
            logger.error(...messages);
          }
        },
      },
      {
        ...opts,
        useLogLevelPrefixes: false,
      },
    );
  }
}
