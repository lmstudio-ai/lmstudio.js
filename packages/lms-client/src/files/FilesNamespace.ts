import { type LoggerInterface, SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type FilesPort } from "@lmstudio/lms-external-backend-interfaces";
import { type ChatMessagePartFileData } from "@lmstudio/lms-shared-types";
import { FileHandle } from "./FileHandle.js";

/**
 * @public
 *
 * The namespace for file-related operations. Currently no public-facing methods.
 */
export class FilesNamespace {
  /** @internal */
  private readonly logger: SimpleLogger;
  /** @internal */
  public constructor(
    /** @internal */
    private readonly filesPort: FilesPort,
    private readonly validator: Validator,
    parentLogger: LoggerInterface,
  ) {
    this.logger = new SimpleLogger("File", parentLogger);
  }

  /**
   * Gets the absolute path to a local file.
   *
   * @internal
   */
  public async getLocalFileAbsolutePath(fileName: string, stack?: string) {
    return await this.filesPort.callRpc("getLocalFileAbsolutePath", { fileName }, { stack });
  }

  /**
   * Creates a file handle from a chat message part file data. Used internally.
   *
   * @internal
   */
  public createFileHandleFromChatMessagePartFileData(data: ChatMessagePartFileData) {
    return new FileHandle(this, data.identifier, data.fileType, data.sizeBytes, data.name);
  }
}
