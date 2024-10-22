import { homedir } from "os";
import { join } from "path";

export const cacheFolder = join(homedir(), ".cache", "lm-studio", ".internal", "es-plugin-runner");
export const esbuildFolder = join(cacheFolder, "esbuild");
export const esbuildOKFlag = join(esbuildFolder, "ok-flag");
