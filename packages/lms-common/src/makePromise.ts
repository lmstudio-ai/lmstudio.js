export function makePromise<T>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (error: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
