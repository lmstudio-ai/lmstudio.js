import { type SimpleLogger } from "@lmstudio/lms-common";
import { isAvailable, type StripNotAvailable } from "@lmstudio/lms-common/dist/LazySignal";
import { type ZodSchema } from "zod";
import { FileData } from "./FileData";

export class SimpleFileData<TData> extends FileData<TData, StripNotAvailable<TData>> {
  public constructor(
    filePath: string,
    defaultData: StripNotAvailable<TData>,
    schema: ZodSchema<StripNotAvailable<TData>>,
    logger?: SimpleLogger,
  ) {
    super(
      filePath,
      defaultData,
      data => {
        if (isAvailable(data)) {
          return data;
        }
        throw new Error("Data is not available");
      },
      data => data,
      schema,
      logger,
    );
  }
}
