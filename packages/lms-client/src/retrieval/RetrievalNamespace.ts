import { type RetrievalChunk } from "@lmstudio/lms-shared-types";
import { type RetrievalOpts } from "./RetrievalOpts";

export class RetrievalNamespace {
  public retrieve(
    _query: string,
    _filePaths: Array<string>,
    _opts?: RetrievalOpts,
  ): Promise<Array<RetrievalChunk>> {
    return Promise.resolve([]);
  }
}
