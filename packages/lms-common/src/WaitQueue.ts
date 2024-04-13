import { SimpleLogger, type LoggerInterface } from "./SimpleLogger";
import { makePromise } from "./makePromise";

const resolvePager = Symbol("resolvePager");
const rejectPager = Symbol("rejectPager");
const dropHolder = Symbol("dropHolder");
const getLogger = Symbol("logger");
const removePager = Symbol("removePager");

export class PagerExitedError extends Error {
  public constructor() {
    super("Pager has been exited");
  }
}

export class QueueClearedError extends Error {
  public constructor() {
    super("Queue has been cleared");
  }
}

/**
 * WaitQueue is a queue that can be used to wait for a resource to become available.
 *
 * It is similar to going to a busy restaurant in that you get a pager (the plastic thing that has a
 * red LED on it), which will beep when your table is ready.
 *
 * The {@link WaitQueue#enterQueue} method is used to get a pager, and the Pager object that is
 * returned can be waited on using the {@link Pager#wait} method, which returns a promise that
 * resolves to a {@link Holder} object. When you are done, {@link Holder#drop} should be called to
 * release the resource. Alternatively, the `using` keyword can be used to automatically release the
 * resource when the block is exited.
 *
 * Queue can be exited with the {@link Pager#exit} method.
 */
export class WaitQueue {
  private readonly logger: SimpleLogger;
  public constructor(parentLogger?: LoggerInterface) {
    this.logger = new SimpleLogger("WaitQueue", parentLogger);
  }
  private readonly pagers: Array<Pager> = [];
  private readonly finalizationRegistry = new FinalizationRegistry(() => {
    this.logger.warnText`
      A holder has been finalized without being dropped! FinalizationRegistry is the last resort
      and should not be relied upon. Please make sure to always drop the holder when you are done
      with it.
    `;
    this.currentlyServing = null;
    this.tryAdvancingQueue();
  });
  private currentlyServing: Pager | null = null;
  /**
   * Enters the queue and returns a pager that can be waited on.
   *
   * @param priority - The priority of the pager. Lower numbers are served first. Defaults to 0.
   */
  public enterQueue(priority = 0): Pager {
    const pager = new Pager(this, priority);
    this.pagers.push(pager);
    this.pagers.sort((a, b) => (a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : 0));
    this.tryAdvancingQueue();
    return pager;
  }
  private tryAdvancingQueue() {
    if (this.currentlyServing === null) {
      const pager = this.pagers.shift();
      if (pager !== undefined) {
        this.currentlyServing = pager;
        const holder = new Holder(this);
        this.finalizationRegistry.register(holder, undefined, holder);
        pager[resolvePager](holder);
      }
    }
  }
  public clearQueue(error: any = new QueueClearedError()) {
    for (const pager of this.pagers) {
      pager[rejectPager](error);
    }
    this.pagers.length = 0;
  }
  /** @internal */
  public [dropHolder](holder: Holder) {
    this.finalizationRegistry.unregister(holder);
    this.currentlyServing = null;
    this.tryAdvancingQueue();
  }
  /** @internal */
  public [getLogger]() {
    return this.logger;
  }
  /** @internal */
  public [removePager](pager: Pager) {
    const index = this.pagers.indexOf(pager);
    if (index !== -1) {
      this.pagers.splice(index, 1);
    } else {
      this.logger.warnText`
        A pager was removed from the queue, but it was not in the queue. This is a bug in the code
        that uses the WaitQueue.
      `;
    }
  }
}

export class Pager {
  private readonly waitingPromise: Promise<Holder>;
  private readonly resolveWaitingPromise: (holder: Holder) => void;
  private readonly rejectWaitingPromise: (error: any) => void;

  /** @internal */
  public constructor(
    private readonly queue: WaitQueue,
    public readonly priority: number,
  ) {
    const { promise, resolve, reject } = makePromise<Holder>();
    this.waitingPromise = promise;
    this.resolveWaitingPromise = resolve;
    this.rejectWaitingPromise = reject;
  }

  /** @internal */
  public [resolvePager](holder: Holder) {
    this.resolveWaitingPromise(holder);
  }

  /** @internal */
  public [rejectPager](error: any) {
    this.rejectWaitingPromise(error);
  }

  public wait() {
    return this.waitingPromise;
  }

  public exit(error: any = new PagerExitedError()) {
    this.queue[removePager](this);
    this[rejectPager](error);
  }
}

export class Holder {
  /** @internal */
  public constructor(private readonly queue: WaitQueue) {}
  private dropped = false;

  public drop() {
    if (this.dropped) {
      this.queue[getLogger]().throw(
        "Holder has already been dropped. This is a bug in the code that uses the WaitQueue.",
      );
    }
    this.dropped = true;
    this.queue[dropHolder](this);
  }

  public [Symbol.dispose]() {
    this.drop();
  }
}
