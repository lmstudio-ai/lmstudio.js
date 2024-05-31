import { isAvailable, type StripNotAvailable } from "@lmstudio/lms-common/dist/LazySignal";
import { type ZodSchema } from "zod";
import { FileData, type FileDataOpts } from "./FileData";

/**
 * Capable of storing JSON serializable values.
 */
export class SimpleFileData<TData> extends FileData<TData> {
  public constructor(
    filePath: string,
    defaultData: StripNotAvailable<TData>,
    schema: ZodSchema<StripNotAvailable<TData>>,
    opts?: FileDataOpts,
  ) {
    super(
      filePath,
      defaultData,
      data => {
        if (isAvailable(data)) {
          if (!schema.safeParse(data).success) {
            throw new Error("Data does not match schema");
          }
          return Buffer.from(JSON.stringify(data), "utf-8");
        }
        throw new Error("Data is not available");
      },
      buffer => schema.parse(JSON.parse(buffer.toString("utf-8"))),
      opts,
    );
  }
}
