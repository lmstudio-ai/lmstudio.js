import { type LoggerInterface, SimpleLogger, text, type Validator } from "@lmstudio/lms-common";
import { type FilesPort } from "@lmstudio/lms-external-backend-interfaces";
import { readFileAsBase64 } from "@lmstudio/lms-isomorphic";
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
   * Adds a temporary file to LM Studio, and returns a FileHandle that can be used to reference this
   * file. This file will be deleted when the client disconnects.
   *
   * This method can only be used in environments that have file system access (such as Node.js).
   */
  public async addImage(path: string): Promise<FileHandle> {
    const result = await readFileAsBase64(path);
    if (result.success === false) {
      throw new Error(text`
        Your current JavaScript environment does not support reading files. If you can read the file
        using other methods, please use "addImageBase64".
      `);
    }
    const fileName = path.split(/[\\/]/).at(-1)!;
    const { identifier, fileType, sizeBytes } = await this.filesPort.callRpc("uploadFileBase64", {
      name: fileName,
      contentBase64: result.base64,
    });
    return new FileHandle(this, identifier, fileType, sizeBytes, fileName);
  }

  /**
   * Adds a temporary file to LM Studio. The content of the file is specified using base64. If you
   * are using Node.js and have a file laying around, consider using `addImage` instead.
   */
  public async addImageBase64(fileName: string, contentBase64: string): Promise<FileHandle> {
    const { identifier, fileType, sizeBytes } = await this.filesPort.callRpc("uploadFileBase64", {
      name: fileName,
      contentBase64,
    });
    return new FileHandle(this, identifier, fileType, sizeBytes, fileName);
  }
}
