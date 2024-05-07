import {
  LazySignal,
  makeSetterWithPatches,
  Signal,
  type Setter,
  type SimpleLogger,
} from "@lmstudio/lms-common";
import { isAvailable, type StripNotAvailable } from "@lmstudio/lms-common/dist/LazySignal";
import { existsSync, writeFileSync } from "fs";
import { mkdir, readFile, watch } from "fs/promises";
import { enablePatches } from "immer";
import path from "path";
import { type ZodSchema } from "zod";
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

export class FileData<TData, TSerialized> {
  public get dataSignal(): LazySignal<TData> {
    if (this.initializationState.type !== "initialized") {
      throw new Error(
        "FileData is not initialized yet, cannot access dataSignal. (Must call init() first)",
      );
    }
    return this.outerSignal;
  }
  private innerSignal!: Signal<TData>;
  private setData!: Setter<TData>;
  private outerSignal!: LazySignal<TData>;
  private lastWroteString: string | null = null;
  private initializationState: InitializationState = { type: "notStarted" };
  public constructor(
    private readonly filePath: string,
    private readonly defaultData: StripNotAvailable<TData>,
    private readonly serializer: (data: TData) => TSerialized,
    private readonly deserializer: (serialized: TSerialized) => StripNotAvailable<TData>,
    private readonly serializedSchema: ZodSchema<TSerialized>,
    private readonly logger?: SimpleLogger,
  ) {}

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

  private async initInternal() {
    this.logger?.debug("Initializing FileData");
    const dir = path.dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    let data: TData | null = null;
    if (!existsSync(this.filePath)) {
      this.logger?.debug("File does not exist, writing default data");
      this.writeData(this.defaultData);
    } else {
      data = await this.readData();
    }
    if (data === null) {
      data = this.defaultData;
    }

    [this.innerSignal, this.setData] = Signal.create<TData>(data);
    this.outerSignal = LazySignal.create(data, setDownstream => {
      const ac = new AbortController();
      this.startWatcher(ac).catch(e => {
        this.logger?.error(`Watcher failed: ${e}`);
      });

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
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Ignore
      }
      throw error;
    }
  }

  private async readData(): Promise<StripNotAvailable<TData> | null> {
    try {
      const content = await readFile(this.filePath, "utf-8");
      if (content === this.lastWroteString) {
        this.logger?.debug("File content is the same as last written, skipping read");
        return null;
      }
      const json = JSON.parse(content);
      const parsed = this.serializedSchema.parse(json);
      const data = this.deserializer(parsed);
      if (isAvailable(data)) {
        return data;
      } else {
        this.logger?.error("Data is not available after deserialization");
        return null;
      }
    } catch (e) {
      this.logger?.error(`Error reading data from file: ${e}`);
      return null;
    }
  }

  private writeData(data: TData) {
    // TODO: We should have a queue to batch up writes
    const serialized = this.serializer(data);
    const json = JSON.stringify(serialized, null, 2);
    if (json === this.lastWroteString) {
      return;
    }
    this.lastWroteString = json;
    try {
      writeFileSync(this.filePath, json);
    } catch (e) {
      this.logger?.error(`Error writing data to file: ${e}`);
    }
  }

  public get() {
    return this.dataSignal.get();
  }

  public readonly set = makeSetterWithPatches<TData>((updater, tags) => {
    this.setData.withPatchUpdater(updater, tags);
    this.writeData(this.dataSignal.get());
  });
}
