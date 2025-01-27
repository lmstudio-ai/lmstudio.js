import { readFile } from "fs/promises";

export async function readFileAsBase64(path: string): Promise<
  | {
      success: true;
      base64: string;
    }
  | {
      success: false;
    }
> {
  return { success: true, base64: await readFile(path, "base64") };
}
