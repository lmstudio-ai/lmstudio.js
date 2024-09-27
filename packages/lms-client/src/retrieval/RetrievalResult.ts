import { type FileHandle } from "../files/FileHandle";

export interface RetrievalResult {
  entries: Array<RetrievalResultEntry>;
}

export interface RetrievalResultEntry {
  content: string;
  score: number;
  source: FileHandle;
}
