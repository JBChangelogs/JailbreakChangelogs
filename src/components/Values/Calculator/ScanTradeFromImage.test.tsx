import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

function setup({
  data = {
    offering: [{ id: 1 }],
    requesting: [{ id: 2 }, { id: 3 }],
  } as unknown,
  status = 200,
  networkError = false,
  invalidJson = false,
  configured = true,
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
  const jsx = () => null;
  const exports = {} as typeof import("./ScanTradeFromImage");
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ScanTradeFromImage.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Event,
      FormData,
      performance: { now: () => 100 },
      process: {
        env: {
          NEXT_PUBLIC_SCANNING_API_URL: configured
            ? "https://scan.example.com"
            : "",
        },
      },
      window: {
        rybbit: {
          event: (...args: unknown[]) => {
            rybbit.push(args);
            if (rybbitThrows) throw new Error("analytics blocked");
          },
        },
      },
      fetch: async () => {
        if (networkError) throw new Error("offline");
        return {
          ok: status < 400,
          status,
          json: async () => {
            if (invalidJson) throw new Error("invalid JSON");
            return data;
          },
        };
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
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: () => ({
              url: "https://scan.example.com/trade",
              headers: {},
            }),
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

test("successful scans report counts and duration alongside the unchanged Rybbit event", async () => {
  const app = setup();
  await app.scan();
  expect(app.results).toHaveLength(1);
  expect(app.events).toEqual([
    { name: "trade_scan", props: { offering: 1, requesting: 2, parse_ms: 0 } },
  ]);
  expect(app.rybbit).toEqual([
    ["Trade Image Scanned", { fileType: "png", source: "picker" }],
  ]);
});

for (const [code, options] of [
  ["network_error", { networkError: true }],
  ["invalid_response", { invalidJson: true }],
  ["invalid_response", { data: null }],
  ["rate_limited", { status: 429 }],
  ["rate_limited", { data: [{ message: "Slow down" }, 429] }],
  ["http_500", { status: 500 }],
  ["api_error", { data: { message: "Failed" } }],
  ["no_items", { data: { offering: [], requesting: [] } }],
  ["not_configured", { configured: false }],
] as const) {
  test(`scan failure reports ${code} once`, async () => {
    const app = setup(options);
    await app.scan();
    expect(app.events).toEqual([
      { name: "trade_scan_failed", props: { code } },
    ]);
    expect(app.results).toHaveLength(0);
  });
}

test("invalid files and dropzone rejections report failure codes", async () => {
  const app = setup();
  await app.scan(new File(["text"], "trade.txt", { type: "text/plain" }));
  await app.scan(new File(["image"], "trade.gif", { type: "image/gif" }));
  app.reject();
  expect(app.events.map((event) => event.props.code)).toEqual([
    "not_image",
    "unsupported_type",
    "file-invalid-type",
  ]);
});

test("a Rybbit exception cannot turn a successful scan into a failure", async () => {
  const app = setup({ rybbitThrows: true });
  await app.scan();
  expect(app.events.map((event) => event.name)).toEqual(["trade_scan"]);
  expect(app.results).toHaveLength(1);
});
