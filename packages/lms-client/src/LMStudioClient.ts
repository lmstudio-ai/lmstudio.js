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
  type BackendInterface,
  type ChannelEndpointsSpecBase,
  type RpcEndpointsSpecBase,
  type SignalEndpointsSpecBase,
  type WritableSignalEndpointsSpecBase,
} from "@lmstudio/lms-communication";
import { getHostedEnv, type ClientPort } from "@lmstudio/lms-communication-client";
import {
  createDiagnosticsBackendInterface,
  createEmbeddingBackendInterface,
  createLlmBackendInterface,
  createRetrievalBackendInterface,
  createSystemBackendInterface,
  type DiagnosticsPort,
  type EmbeddingPort,
  type LLMPort,
  type RetrievalPort,
  type SystemPort,
} from "@lmstudio/lms-external-backend-interfaces";
import {
  createFilesBackendInterface,
  type FilesPort,
} from "@lmstudio/lms-external-backend-interfaces/dist/filesBackendInterface";
import { generateRandomBase64 } from "@lmstudio/lms-isomorphic";
import chalk from "chalk";
import process from "process";
import { z } from "zod";
import { createAuthenticatedClientPort } from "./createAuthenticatedClientPort";
import { DiagnosticsNamespace } from "./diagnostics/DiagnosticsNamespace";
import { EmbeddingNamespace } from "./embedding/EmbeddingNamespace";
import { FilesNamespace } from "./files/FilesNamespace";
import { friendlyErrorDeserializer } from "./friendlyErrorDeserializer";
import { LLMNamespace } from "./llm/LLMNamespace";
import { RetrievalNamespace } from "./retrieval/RetrievalNamespace";
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

    // Internal testing options
    disableConnection: z.boolean().optional(),
    llmPort: z.any().optional(),
    embeddingPort: z.any().optional(),
    systemPort: z.any().optional(),
    diagnosticsPort: z.any().optional(),
    retrievalPort: z.any().optional(),
    filesPort: z.any().optional(),
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
  private readonly embeddingPort: EmbeddingPort;
  /** @internal */
  private readonly systemPort: SystemPort;
  /** @internal */
  private readonly diagnosticsPort: DiagnosticsPort;
  /** @internal */
  private readonly retrievalPort: RetrievalPort;
  /** @internal */
  private readonly filesPort: FilesPort;

  public readonly llm: LLMNamespace;
  public readonly embedding: EmbeddingNamespace;
  public readonly system: SystemNamespace;
  public readonly diagnostics: DiagnosticsNamespace;
  public readonly retrieval: RetrievalNamespace;
  public readonly files: FilesNamespace;

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
    if (getHostedEnv() !== null) {
      return Promise.resolve("Using hosted env");
    }
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

  private createPort<
    TRpcEndpoints extends RpcEndpointsSpecBase,
    TChannelEndpoints extends ChannelEndpointsSpecBase,
    TSignalEndpoints extends SignalEndpointsSpecBase,
    TWritableSignalEndpoints extends WritableSignalEndpointsSpecBase,
  >(
    namespace: string,
    name: string,
    backendInterface: BackendInterface<
      never,
      TRpcEndpoints,
      TChannelEndpoints,
      TSignalEndpoints,
      TWritableSignalEndpoints
    >,
  ): ClientPort<TRpcEndpoints, TChannelEndpoints, TSignalEndpoints, TWritableSignalEndpoints> {
    return createAuthenticatedClientPort(
      backendInterface,
      this.resolvingBaseUrl,
      namespace,
      this.clientIdentifier,
      this.clientPasskey,
      new SimpleLogger(name, this.logger),
      {
        errorDeserializer: friendlyErrorDeserializer,
        verboseErrorMessage: this.verboseErrorMessages,
      },
    );
  }

  private resolvingBaseUrl: string | Promise<string>;
  private verboseErrorMessages: boolean;

  public constructor(opts: LMStudioClientConstructorOpts = {}) {
    const {
      logger,
      baseUrl,
      verboseErrorMessages,
      clientIdentifier,
      clientPasskey,
      disableConnection,
      llmPort,
      embeddingPort,
      systemPort,
      diagnosticsPort,
      retrievalPort,
      filesPort,
    } = new Validator().validateConstructorParamOrThrow(
      "LMStudioClient",
      "opts",
      constructorOptsSchema,
      opts,
    ) satisfies LMStudioClientConstructorOpts;
    this.logger = new SimpleLogger("LMStudioClient", logger);
    this.clientIdentifier = clientIdentifier ?? generateRandomBase64(18);
    this.clientPasskey = clientPasskey ?? generateRandomBase64(18);

    const stack = getCurrentStack(1);
    if (disableConnection) {
      this.resolvingBaseUrl = new Promise(() => undefined);
    } else {
      if (baseUrl === undefined) {
        this.resolvingBaseUrl = this.guessBaseUrl(verboseErrorMessages ? stack : undefined);
      } else {
        this.validateBaseUrlOrThrow(baseUrl);
        this.resolvingBaseUrl = baseUrl;
      }
    }
    this.verboseErrorMessages = verboseErrorMessages ?? false;

    this.llmPort = llmPort ?? this.createPort("llm", "LLM", createLlmBackendInterface());
    this.embeddingPort =
      embeddingPort ?? this.createPort("embedding", "Embedding", createEmbeddingBackendInterface());
    this.systemPort =
      systemPort ?? this.createPort("system", "System", createSystemBackendInterface());
    this.diagnosticsPort =
      diagnosticsPort ??
      this.createPort("diagnostics", "Diagnostics", createDiagnosticsBackendInterface());
    this.retrievalPort =
      retrievalPort ?? this.createPort("retrieval", "Retrieval", createRetrievalBackendInterface());
    this.filesPort = filesPort ?? this.createPort("files", "Files", createFilesBackendInterface());

    const validator = new Validator();

    this.llm = new LLMNamespace(
      this,
      this.llmPort,
      new SimpleLogger("LLM", this.logger),
      validator,
    );
    this.embedding = new EmbeddingNamespace(
      this,
      this.embeddingPort,
      new SimpleLogger("Embedding", this.logger),
      validator,
    );
    this.system = new SystemNamespace(this.systemPort, this.logger);
    this.diagnostics = new DiagnosticsNamespace(this.diagnosticsPort, validator, this.logger);
    this.retrieval = new RetrievalNamespace(
      this.retrievalPort,
      validator,
      this.embedding,
      this.logger,
    );
    this.files = new FilesNamespace(this.filesPort, validator, this.logger);
  }
}
