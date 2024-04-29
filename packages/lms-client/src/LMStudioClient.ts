import {
  getCurrentStack,
  lmsDefaultPorts,
  makePrettyError,
  SimpleLogger,
  text,
  Validator,
  type LoggerInterface,
} from "@lmstudio/lms-common";
import {
  createDiagnosticsBackendInterface,
  type DiagnosticsPort,
} from "@lmstudio/lms-diagnostics-backend-interface";
import { generateRandomBase64 } from "@lmstudio/lms-isomorphic";
import { createLlmBackendInterface, type LLMPort } from "@lmstudio/lms-llm-backend-interface";
import {
  createSystemBackendInterface,
  type SystemPort,
} from "@lmstudio/lms-system-backend-interface";
import chalk from "chalk";
import process from "process";
import { z } from "zod";
import { createAuthenticatedClientPort } from "./createAuthenticatedClientPort";
import { DiagnosticsNamespace } from "./diagnostics/DiagnosticsNamespace";
import { friendlyErrorDeserializer } from "./friendlyErrorDeserializer";
import { LLMNamespace } from "./llm/LLMNamespace";
import { SystemNamespace } from "./system/SystemNamespace";

/** @public */
export interface LMStudioClientConstructorOpts {
  /**
   * Changes the logger that is used by LMStudioClient internally. The default logger is `console`.
   * By default, LMStudioClient only logs warnings and errors that require user intervention. If the
   * `verbose` option is enabled while calling supporting methods, those messages will also be
   * directed to the specified logger.
   */
  logger?: LoggerInterface;
  /**
   * The base URL of the LM Studio server. If not provided, LM Studio will attempt to connect to the
   * localhost with various default ports.
   *
   * If you have set a custom port and/or are reverse-proxying, you should pass in the baseUrl.
   *
   * Since LM Studio uses WebSockets, the protocol must be "ws" or "wss".
   *
   * For example, if have changed the port to 8080, you should create the LMStudioClient like so:
   *
   * ```typescript
   * const client = new LMStudioClient({ baseUrl: "ws://127.0.0.1:8080" });
   * ```
   */
  baseUrl?: string;
  /**
   * Whether to include stack traces in the errors caused by LM Studio. By default, this is set to
   * `false`. If set to `true`, LM Studio SDK will include a stack trace in the error message.
   */
  verboseErrorMessages?: boolean;
  /**
   * Changes the client identifier used to authenticate with LM Studio. By default, it uses a
   * randomly generated string.
   *
   * If you wish to share resources across multiple LMStudioClient, you should set them to use the
   * same `clientIdentifier` and `clientPasskey`.
   */
  clientIdentifier?: string;
  /**
   * Changes the client passkey used to authenticate with LM Studio. By default, it uses a randomly
   * generated string.
   *
   * If you wish to share resources across multiple LMStudioClient, you should set them to use the
   * same `clientIdentifier` and `clientPasskey`.
   */
  clientPasskey?: string;
}
const constructorOptsSchema = z
  .object({
    logger: z.any().optional(),
    baseUrl: z.string().optional(),
    verboseErrorMessages: z.boolean().optional(),
    clientIdentifier: z.string().optional(),
    clientPasskey: z.string().optional(),
  })
  .strict();

/** @public */
export class LMStudioClient {
  /** @internal */
  private readonly logger: SimpleLogger;

  public readonly clientIdentifier: string;
  /** @internal */
  private readonly clientPasskey: string;

  /** @internal */
  private readonly llmPort: LLMPort;
  /** @internal */
  private readonly systemPort: SystemPort;
  /** @internal */
  private readonly diagnosticsPort: DiagnosticsPort;

  public readonly llm: LLMNamespace;
  public readonly system: SystemNamespace;
  public readonly diagnostics: DiagnosticsNamespace;

  /** @internal */
  private validateBaseUrlOrThrow(baseUrl: string) {
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch (e) {
      this.logger.throw(text`
        Failed to construct LMStudioClient. The baseUrl passed in is invalid. Received: ${baseUrl}
      `);
    }
    if (!["ws:", "wss:"].includes(url.protocol)) {
      this.logger.throw(text`
        Failed to construct LMStudioClient. The baseUrl passed in must have protocol "ws" or "wss". 
        Received: ${baseUrl}
      `);
    }
    if (url.search !== "") {
      this.logger.throw(text`
        Failed to construct LMStudioClient. The baseUrl passed contains search parameters
        ("${url.search}").
      `);
    }
    if (url.hash !== "") {
      this.logger.throw(text`
        Failed to construct LMStudioClient. The baseUrl passed contains a hash ("${url.hash}").
      `);
    }
    if (url.username !== "" || url.password !== "") {
      this.logger.throw(text`
        Failed to construct LMStudioClient. The baseUrl passed contains a username or password. We
        do not support these in the baseUrl. Received: ${baseUrl}
      `);
    }
    if (baseUrl.endsWith("/")) {
      this.logger.throw(text`
        Failed to construct LMStudioClient. The baseUrl passed in must not end with a "/". If you
        are reverse-proxying, you should remove the trailing slash from the baseUrl. Received:
        ${baseUrl}
      `);
    }
  }

  private async isLocalhostWithGivenPortLMStudioServer(port: number): Promise<number> {
    const response = await fetch(`http://127.0.0.1:${port}/lmstudio-greeting`);
    if (response.status !== 200) {
      throw new Error("Status is not 200.");
    }
    const json = await response.json();
    if (json?.lmstudio !== true) {
      throw new Error("Not an LM Studio server.");
    }
    return port;
  }

  /**
   * Guess the base URL of the LM Studio server by visiting localhost on various default ports.
   */
  private async guessBaseUrl(stack?: string): Promise<string> {
    return Promise.any(lmsDefaultPorts.map(this.isLocalhostWithGivenPortLMStudioServer)).then(
      port => `ws://127.0.0.1:${port}`,
      () => {
        throw makePrettyError(
          text`
            ${chalk.redBright("Failed to connect to LM Studio on the default port (1234).")}

            Is LM Studio running? If not, you can start it by running:

                ${chalk.yellow("lms server start" + ((process as any).browser ? " --cors=true" : ""))}

            ${chalk.white("(i) For more information, refer to the LM Studio documentation:")}

                ${chalk.gray("https://lmstudio.ai/docs/local-server")}
          `,
          stack,
        );
        // console.error(text`
        //   ${chalk.blueBright(text`
        //     · HINT: If you are using a custom port and/or are reverse-proxying, you should pass the
        //     base URL to the LMStudioClient constructor like so:
        //   `)}

        //       ${chalk.cyanBright(text`
        //         const client = new LMStudioClient({ baseUrl: "ws://127.0.0.1:<PORT>" });
        //       `)}

        // `);
        // // We just want to return a promise that never resolves.
        // // This blocks all the API calls.
        // return new Promise(() => undefined);
      },
    );
  }

  public constructor(opts: LMStudioClientConstructorOpts = {}) {
    const { logger, baseUrl, verboseErrorMessages, clientIdentifier, clientPasskey } =
      new Validator().validateConstructorParamOrThrow(
        "LMStudioClient",
        "opts",
        constructorOptsSchema,
        opts,
      ) satisfies LMStudioClientConstructorOpts;
    this.logger = new SimpleLogger("LMStudioClient", logger);
    this.clientIdentifier = clientIdentifier ?? generateRandomBase64(18);
    this.clientPasskey = clientPasskey ?? generateRandomBase64(18);

    const stack = getCurrentStack(1);
    let resolvingBaseUrl: string | Promise<string>;
    if (baseUrl === undefined) {
      resolvingBaseUrl = this.guessBaseUrl(verboseErrorMessages ? stack : undefined);
    } else {
      this.validateBaseUrlOrThrow(baseUrl);
      resolvingBaseUrl = baseUrl;
    }

    this.llmPort = createAuthenticatedClientPort(
      createLlmBackendInterface(),
      resolvingBaseUrl,
      "llm",
      this.clientIdentifier,
      this.clientPasskey,
      new SimpleLogger("LLM", this.logger),
      {
        errorDeserializer: friendlyErrorDeserializer,
        verboseErrorMessage: verboseErrorMessages ?? false,
      },
    );

    this.systemPort = createAuthenticatedClientPort(
      createSystemBackendInterface(),
      resolvingBaseUrl,
      "system",
      this.clientIdentifier,
      this.clientPasskey,
      new SimpleLogger("System", this.logger),
      {
        errorDeserializer: friendlyErrorDeserializer,
        verboseErrorMessage: verboseErrorMessages ?? false,
      },
    );

    this.diagnosticsPort = createAuthenticatedClientPort(
      createDiagnosticsBackendInterface(),
      resolvingBaseUrl,
      "diagnostics",
      this.clientIdentifier,
      this.clientPasskey,
      new SimpleLogger("Diagnostics", this.logger),
      {
        errorDeserializer: friendlyErrorDeserializer,
        verboseErrorMessage: verboseErrorMessages ?? false,
      },
    );

    const validator = new Validator();

    this.llm = new LLMNamespace(this.llmPort, validator, this.logger);
    this.system = new SystemNamespace(this.systemPort, this.logger);
    this.diagnostics = new DiagnosticsNamespace(this.diagnosticsPort, validator, this.logger);
  }
}
