import { FileData, type FileDataOpts } from "./FileData.js";

/**
 * Capable of storing plain text
 */
export class PlainTextFileData extends FileData<string> {
  public constructor(
    filePath: string,
    defaultData: string | (() => string | Promise<string>) = "",
    opts?: FileDataOpts,
  ) {
    super(
      filePath,
      defaultData,
      data => Buffer.from(data, "utf-8"),
      buffer => buffer.toString("utf-8"),
      opts,
    );
  }
}
