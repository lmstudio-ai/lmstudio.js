export function makePromise<downloadPromise>() {
  let resolve: (value: downloadPromise | PromiseLike<downloadPromise>) => void;
  let reject: (error: any) => void;
  const promise = new Promise<downloadPromise>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve: resolve!, reject: reject! };
}
