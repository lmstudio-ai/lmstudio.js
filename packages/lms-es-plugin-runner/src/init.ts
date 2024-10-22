import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { extract } from "pacote";
import { esbuildFolder, esbuildOKFlag } from "./paths";

/**
 * Initializes the es plugin runtime.
 */
export async function init() {
  if (!existsSync(esbuildOKFlag)) {
    await initEsbuild();
  }
}

async function initEsbuild() {
  await mkdir(esbuildFolder, { recursive: true });
  await extract("esbuild@0.24.0", esbuildFolder);
}
