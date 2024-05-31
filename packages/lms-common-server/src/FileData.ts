import {
  LazySignal,
  makeSetterWithPatches,
  Signal,
  SimpleLogger,
  type Setter,
} from "@lmstudio/lms-common";
import { isAvailable, type StripNotAvailable } from "@lmstudio/lms-common/dist/LazySignal";
import { existsSync, writeFileSync , readFileSync } from "fs";
import { mkdir, readFile, watch } from "fs/promises";
import { enablePatches } from "immer";
import path from "path";

enablePatches();

export type InitializationState =
  | {
      type: "notStarted";
    }
  | {
      type: "initializing";
      promise: Promise<void>;
    }
  | {
      type: "initialized";
    };

export interface FileDataOpts {
  logger?: SimpleLogger;
  watch?: boolean;
  /**
   * If the file does not exist, do not create it until the first write.
   *
   * The default value will still be available for use.
   */
  doNotCreateOnInit?: boolean;
  /**
   * Whether to make a backup of the file when a read fail to parse.
   */
  makeBackupOnFail?: boolean;
  onDelete?: () => void;
}

export class FileData<TData> {
  public get dataSignal(): LazySignal<TData> {
    if (this.initializationState.type !== "initialized") {
      throw new Error(
        "FileData is not initialized yet, cannot access dataSignal. (Must call init() first)",
      );
    }
    return this.outerSignal;
  }
  private innerSignal!: Signal<StripNotAvailable<TData>>;
  private setData!: Setter<TData>;
  private outerSignal!: LazySignal<TData>;
  private lastWroteBuffer: Buffer | null = null;
  private initializationState: InitializationState = { type: "notStarted" };
  private readonly logger: SimpleLogger;
  private readonly shouldWatch: boolean;
  private readonly doNotCreateOnInit: boolean;
  private readonly makeBackupOnFail: boolean;
  private readonly onDelete?: () => void;
  public constructor(
    private readonly filePath: string,
    private readonly defaultData:
      | StripNotAvailable<TData>
      | (() => StripNotAvailable<TData> | Promise<StripNotAvailable<TData>>),
    private readonly serializer: (data: TData) => Buffer,
    private readonly deserializer: (serialized: Buffer) => StripNotAvailable<TData>,
    { logger, watch, doNotCreateOnInit, makeBackupOnFail, onDelete }: FileDataOpts = {},
  ) {
    this.logger = logger ?? new SimpleLogger("FileData");
    this.shouldWatch = watch ?? false;
    this.doNotCreateOnInit = doNotCreateOnInit ?? false;
    this.makeBackupOnFail = makeBackupOnFail ?? false;
    if (!this.shouldWatch && onDelete) {
      throw new Error("onDelete is only supported when watching is enabled");
    }
  }

  public async init() {
    if (this.initializationState.type === "initializing") {
      await this.initializationState.promise;
      return;
    }
    if (this.initializationState.type === "initialized") {
      return;
    }
    const initPromise = this.initInternal();
    this.initializationState = { type: "initializing", promise: initPromise };
    await initPromise;
    this.initializationState = { type: "initialized" };
  }

  private async getDefaultData(): Promise<StripNotAvailable<TData>> {
    return typeof this.defaultData === "function"
      ? await (this.defaultData as any)()
      : this.defaultData;
  }

  private async initInternal() {
    this.logger?.debug("Initializing FileData");
    const dir = path.dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    let data: StripNotAvailable<TData> | null = null;
    if (!existsSync(this.filePath)) {
      data = await this.getDefaultData();
      if (!this.doNotCreateOnInit) {
        this.logger?.debug("File does not exist, writing default data");
        this.writeData(data);
      }
    } else {
      data = await this.readData();
    }
    if (data === null) {
      data = await this.getDefaultData();
      this.writeData(data);
    }

    [this.innerSignal, this.setData] = Signal.create<StripNotAvailable<TData>>(data) as any;
    this.outerSignal = LazySignal.create<TData>(data, setDownstream => {
      const ac = new AbortController();
      setDownstream(this.innerSignal.get());

      if (this.shouldWatch) {
        this.startWatcher(ac).catch(e => {
          if (e.name === "AbortError") {
            return;
          }
          this.logger?.error(`Watcher failed: ${e}`);
        });
      }

      const unsubscribe = this.innerSignal.subscribe((_data, patches, tags) => {
        setDownstream.withPatches(patches, tags);
      });
      return () => {
        ac.abort();
        unsubscribe();
      };
    });
  }

  private async startWatcher(ac: AbortController) {
    const watcher = watch(this.filePath, {
      persistent: false,
      signal: ac.signal,
    });
    try {
      for await (const event of watcher) {
        if (event.eventType === "change") {
          this.logger?.debug("File changed, reading data");
          const data = await this.readData();
          if (data !== null) {
            this.setData(data);
          }
        } else if (event.eventType === "rename") {
          this.logger?.debug("File renamed, reinitializing");
          this.onDelete?.();
          this.setData(await this.getDefaultData());
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Ignore
      }
      throw error;
    }
  }

  private makeBackup() {
    this.logger?.error("Making backup of file");
    try {
      let id = 1;
      while (existsSync(`${this.filePath}.bak.${id}`)) {
        id++;
      }
      writeFileSync(`${this.filePath}.bak.${id}`, readFileSync(this.filePath));
    } catch (e) {
      this.logger?.error(`Error making backup: ${e}`);
    }
  }

  private async readData(): Promise<StripNotAvailable<TData> | null> {
    try {
      const content = await readFile(this.filePath);
      if (this.lastWroteBuffer !== null && content.equals(this.lastWroteBuffer)) {
        this.logger?.debug("File content is the same as last written, skipping read");
        return null;
      }
      const data = this.deserializer(content);
      if (isAvailable(data)) {
        return data;
      } else {
        this.logger?.error("Data is not available after deserialization");
        return null;
      }
    } catch (e) {
      this.logger?.error(`Error reading data from file: ${e}`);
      if (this.makeBackupOnFail) {
        this.makeBackup();
      }
      return null;
    }
  }

  private writeData(data: TData) {
    // TODO: We should have a queue to batch up writes
    const serialized = this.serializer(data);
    this.lastWroteBuffer = serialized;
    try {
      writeFileSync(this.filePath, serialized);
    } catch (e) {
      this.logger?.error(`Error writing data to file: ${e}`);
    }
  }

  public get() {
    return this.dataSignal.get();
  }

  public readonly set = makeSetterWithPatches<TData>((updater, tags) => {
    this.setData.withPatchUpdater(updater, tags);
    this.writeData(this.innerSignal.get());
  });
}
