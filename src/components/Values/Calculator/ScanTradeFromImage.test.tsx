import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { TradeScanError } from "./tradeScan";

const TIMINGS = { ocr_ms: 300, det_ms: 100, rec_ms: 200 };

function setup({
  parsed = {
    offering: [{ id: 1 }],
    requesting: [{ id: 2 }, { id: 3 }],
  } as unknown,
  workerError = null as string | null,
  workerCrash = false,
  catalogError = false,
  parseError = null as Error | null,
  rybbitThrows = false,
} = {}) {
  const events: Array<{ name: string; props: Record<string, unknown> }> = [];
  const rybbit: unknown[][] = [];
  const results: unknown[] = [];
  let onDrop!: (
    files: File[],
    rejected: Array<{ errors: Array<{ code: string }> }>,
    event: Event,
  ) => Promise<void> | void;
  let scan!: (file: File, source: string) => Promise<void>;
  let now = 100;
  const jsx = () => null;
  const exports = {} as typeof import("./ScanTradeFromImage");

  class FakeWorker {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    terminate() {}
    postMessage() {
      queueMicrotask(() => {
        if (workerCrash) return this.onerror?.();
        this.onmessage?.({
          data: workerError
            ? { error: workerError }
            : {
                result: {
                  detections: [{}, {}, {}, {}],
                  height: 1000,
                  timings: TIMINGS,
                },
              },
        });
      });
    }
  }

  runInNewContext(
    transpileModule(
      // `import.meta` can't run in this CommonJS sandbox; the worker URL is unused anyway.
      readFileSync(
        new URL("./ScanTradeFromImage.tsx", import.meta.url),
        "utf8",
      ).replace("import.meta.url", "moduleUrl"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Event,
      URL,
      Worker: FakeWorker,
      queueMicrotask,
      moduleUrl: "file:///ScanTradeFromImage.tsx",
      performance: { now: () => now++ },
      window: {
        rybbit: {
          event: (...args: unknown[]) => {
            rybbit.push(args);
            if (rybbitThrows) throw new Error("analytics blocked");
          },
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (value: unknown) => [value, () => {}],
            useEffect: () => {},
            useMemo: (fn: () => unknown) => fn(),
            useCallback: (fn: typeof scan) => (scan = fn),
          };
        if (name === "react-dropzone")
          return {
            useDropzone: (options: { onDrop: typeof onDrop }) => {
              onDrop = options.onDrop;
              return { getRootProps: () => ({}), getInputProps: () => ({}) };
            },
          };
        if (name === "@/utils/analytics/web")
          return {
            trackWebEvent: (name: string, props: Record<string, unknown>) =>
              events.push({ name, props }),
          };
        if (name === "@/utils/api/fetchTradeItemsByIds")
          return {
            fetchTradeCatalog: () =>
              catalogError
                ? Promise.reject(new Error("catalog down"))
                : Promise.resolve(new Map()),
          };
        if (name === "./tradeScan")
          return {
            TradeScanError,
            parseTradeScan: () => {
              if (parseError) throw parseError;
              return parsed;
            },
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "sonner")
          return {
            toast: { loading: () => 1, success: () => {}, error: () => {} },
          };
        return {};
      },
    },
  );
  exports.ScanTradeFromImage({
    onScanSuccess: (result) => results.push(result),
  });
  return {
    events,
    rybbit,
    results,
    scan: (file = new File(["image"], "trade.png", { type: "image/png" })) =>
      scan(file, "picker"),
    reject: () =>
      onDrop(
        [],
        [{ errors: [{ code: "file-invalid-type" }] }],
        new Event("drop"),
      ),
  };
}

test("successful scans report the app's scan fields, OCR timings included", async () => {
  const app = setup();
  await app.scan();
  expect(app.results).toHaveLength(1);
  expect(app.events).toEqual([
    {
      name: "trade_scan",
      props: {
        mode: "upload",
        scope: "area",
        offering: 1,
        requesting: 2,
        detections: 4,
        parse_ms: 1,
        ...TIMINGS,
      },
    },
  ]);
  expect(app.rybbit).toEqual([
    ["Trade Image Scanned", { fileType: "png", source: "picker" }],
  ]);
});

for (const [code, options] of [
  ["ocr_failed", { workerError: "model download failed" }],
  ["ocr_failed", { workerCrash: true }],
  ["catalog_failed", { catalogError: true }],
  ["parse_failed", { parseError: new Error("boom") }],
  [
    "too_many_text_regions",
    {
      parseError: new TradeScanError(
        "too_many_text_regions",
        "Too much text in the image to read a trade.",
      ),
    },
  ],
] as const) {
  test(`scan failure reports ${code} once`, async () => {
    const app = setup(options);
    await app.scan();
    expect(app.events).toEqual([
      { name: "trade_scan_failed", props: { mode: "upload", code } },
    ]);
    expect(app.results).toHaveLength(0);
  });
}

test("invalid files and dropzone rejections report failure codes", async () => {
  const app = setup();
  await app.scan(new File(["text"], "trade.txt", { type: "text/plain" }));
  await app.scan(new File(["image"], "trade.gif", { type: "image/gif" }));
  app.reject();
  expect(app.events).toEqual([
    { name: "trade_scan_failed", props: { mode: "upload", code: "not_image" } },
    {
      name: "trade_scan_failed",
      props: { mode: "upload", code: "unsupported_type" },
    },
    {
      name: "trade_scan_failed",
      props: { mode: "upload", code: "file-invalid-type" },
    },
  ]);
});

test("a Rybbit exception cannot turn a successful scan into a failure", async () => {
  const app = setup({ rybbitThrows: true });
  await app.scan();
  expect(app.events.map((event) => event.name)).toEqual(["trade_scan"]);
  expect(app.results).toHaveLength(1);
});

test("empty scans report zero counts like the app without applying items", async () => {
  const app = setup({ parsed: { offering: [], requesting: [] } });
  await app.scan();
  expect(app.events).toEqual([
    {
      name: "trade_scan",
      props: {
        mode: "upload",
        scope: "area",
        offering: 0,
        requesting: 0,
        detections: 4,
        parse_ms: 1,
        ...TIMINGS,
      },
    },
  ]);
  expect(app.results).toHaveLength(0);
  expect(app.rybbit).toHaveLength(0);
});
