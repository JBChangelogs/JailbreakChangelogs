export function waitForImage(
  url: string,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    let retry: ReturnType<typeof setTimeout>;
    const finish = (loaded: boolean) => {
      clearTimeout(retry);
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
      resolve(loaded);
    };
    const abort = () => finish(false);
    const load = () => {
      image.src = url;
    };
    const timeout = setTimeout(() => finish(false), 10_000);
    image.onload = () => finish(true);
    image.onerror = () => {
      retry = setTimeout(load, 1_000);
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else load();
  });
}
