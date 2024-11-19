export interface DeferredPromise<TData> {
  promise: Promise<TData>;
  resolve(value: TData | PromiseLike<TData>): void;
  reject(error: any): void;
}

export function makePromise<TData>(): DeferredPromise<TData> {
  let resolve: (value: TData | PromiseLike<TData>) => void;
  let reject: (error: any) => void;
  const promise = new Promise<TData>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
