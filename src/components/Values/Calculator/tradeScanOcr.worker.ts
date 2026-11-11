import { readTradeScreenshot } from "./tradeScanOcr";

interface WorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<File>) => void,
  ): void;
  postMessage(message: unknown): void;
}

const workerScope = globalThis as unknown as WorkerScope;

workerScope.addEventListener("message", (event) => {
  readTradeScreenshot(event.data).then(
    (result) => workerScope.postMessage({ result }),
    (error: unknown) =>
      workerScope.postMessage({
        error: error instanceof Error ? error.message : String(error),
      }),
  );
});
