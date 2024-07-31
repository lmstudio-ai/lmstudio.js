export class Cleaner {
  private readonly cleanups: Array<() => void> = [];
  public register(fn: () => void) {
    this.cleanups.push(fn);
  }
  public [Symbol.dispose]() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
  }
}
