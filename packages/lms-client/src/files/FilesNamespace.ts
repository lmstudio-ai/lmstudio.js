import { type LoggerInterface, SimpleLogger, type Validator } from "@lmstudio/lms-common";
import { type FilesPort } from "@lmstudio/lms-external-backend-interfaces";
import { type ChatMessagePartFileData } from "@lmstudio/lms-shared-types";
import { FileHandle } from "./FileHandle.js";

/**
 * @public
 *
 * The namespace for file-related operations.
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

  /**
   * Uploads a file with the given name and content. The file uploaded will be temporary and will be
   * deleted when the client disconnects.
   */
  public async uploadTempFile(fileName: string, content: Uint8Array) {
    const contentBase64 = Buffer.from(content).toString("base64");
    const { identifier, fileType, sizeBytes } = await this.filesPort.callRpc("uploadFileBase64", {
      name: fileName,
      contentBase64,
    });
    return new FileHandle(this, identifier, fileType, sizeBytes, fileName);
  }
}
