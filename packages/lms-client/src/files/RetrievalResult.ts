import { type FileHandle } from "./FileHandle.js";

/** @public */
export interface RetrievalResult {
  entries: Array<RetrievalResultEntry>;
}

/** @public */
export interface RetrievalResultEntry {
  content: string;
  score: number;
  source: FileHandle;
}
