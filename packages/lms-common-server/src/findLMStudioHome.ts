import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

let lmstudioHome: string | null = null;

export function findLMStudioHome() {
  if (lmstudioHome !== null) {
    return lmstudioHome;
  }

  const pointerFilePath = join(homedir(), ".lmstudio-home-pointer");
  if (existsSync(pointerFilePath)) {
    lmstudioHome = readFileSync(pointerFilePath, "utf-8").trim();
    return lmstudioHome;
  }

  // See if ~/.cache/lm-studio exists. If it does, use it.
  const cacheHome = join(homedir(), ".cache", "lm-studio");
  if (existsSync(cacheHome)) {
    lmstudioHome = cacheHome;
    writeFileSync(pointerFilePath, lmstudioHome, "utf-8");
    return lmstudioHome;
  }

  // Otherwise, fallback to ~/.lmstudio
  const home = join(homedir(), ".lmstudio");
  lmstudioHome = home;
  writeFileSync(pointerFilePath, lmstudioHome, "utf-8");
  return lmstudioHome;
}
