import { Event, SimpleLogger } from "@lmstudio/lms-common";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { type Esbuild } from "./Esbuild";
import { createEsBuildArgs } from "./esbuildArgs";
import { generateEntryFile } from "./generateEntryFile";

const buildFinishedTriggerString = "build finished";
const trimPrefix = "[watch] ";
const trimSuffix = "\n";

export class EsPluginRunnerWatcher {
  public readonly updatedEvent: Event<void>;
  private readonly emitUpdateEvent: () => void;

  public constructor(
    private readonly esbuild: Esbuild,
    private readonly projectPath: string,
    private readonly logger: SimpleLogger,
  ) {
    [this.updatedEvent, this.emitUpdateEvent] = Event.create<void>();
  }

  private readonly lmstudioCacheFolderPath = join(this.projectPath, ".lmstudio");

  private started = false;
  public async start() {
    if (this.started) {
      throw new Error("The watcher has already started.");
    }
    this.started = true;
    await this.esbuild.check();
    const entryFilePath = await this.createEntryFile();
    const args = await this.createEsBuildArgs(entryFilePath);
    const esbuildProcess = this.esbuild.spawn(args);
    const esbuildLogger = new SimpleLogger("esbuild", this.logger);

    // Detect the "build finished" string in the output. Not most performant solution, but works.
    let stringBuffer = "";
    // Esbuild logs to stderr
    esbuildProcess.stderr.on("data", (data: Buffer) => {
      let string = data.toString("utf-8");
      if (string.startsWith(trimPrefix)) {
        string = string.slice(trimPrefix.length);
      }
      if (string.endsWith(trimSuffix)) {
        string = string.slice(0, -trimSuffix.length);
      }
      esbuildLogger.info(string);
      stringBuffer += string;
      if (stringBuffer.includes(buildFinishedTriggerString)) {
        this.emitUpdateEvent();
      }
      // Keep the last buildFinishedTriggerString.length - 1 characters
      stringBuffer = stringBuffer.slice(-buildFinishedTriggerString.length + 1);
    });
  }
  /**
   * Creates the entry.ts file in .lmstudio
   */
  private async createEntryFile() {
    await mkdir(this.lmstudioCacheFolderPath, { recursive: true });
    const entryFilePath = join(this.lmstudioCacheFolderPath, "entry.ts");

    const content = generateEntryFile({});
    await writeFile(entryFilePath, content);
    return entryFilePath;
  }
  /**
   * Creates the esbuild args
   */
  private async createEsBuildArgs(entryFilePath: string) {
    const args = createEsBuildArgs({
      entryPath: entryFilePath,
      outPath: join(this.lmstudioCacheFolderPath, "dev.js"),
      watch: true,
      production: false,
    });
    return args;
  }
}
