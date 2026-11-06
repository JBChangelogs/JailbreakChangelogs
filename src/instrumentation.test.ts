import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

const SpanStatusCode = { UNSET: 0, OK: 1, ERROR: 2 };

const source = transpileModule(
  readFileSync(new URL("./instrumentation.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS } },
).outputText;

test("tracing initializes only with a Node collector and preserves Railway flag initialization", async () => {
  for (const env of [
    { NEXT_RUNTIME: "nodejs" },
    { NEXT_RUNTIME: "nodejs", OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector" },
    {
      NEXT_RUNTIME: "nodejs",
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "http://collector/v1/traces",
    },
    { NEXT_RUNTIME: "edge", OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector" },
  ]) {
    const calls: string[] = [];
    const options: unknown[] = [];
    const exports = {} as { register: () => Promise<void> };
    runInNewContext(source, {
      exports,
      process: {
        env: {
          ...env,
          RAILWAY_INTERNAL_API_URL: "http://api.railway.internal:8080/",
          NEXT_PUBLIC_API_URL: "https://api.example.com",
        },
      },
      require: (name: string) => {
        if (name === "@vercel/otel") {
          return {
            registerOTel: (config: unknown) => {
              calls.push("tracing");
              options.push(config);
            },
          };
        }
        if (name === "railway") {
          return { flags: { init: async () => calls.push("flags") } };
        }
        if (name === "@opentelemetry/api") {
          return { trace: { getActiveSpan: () => undefined }, SpanStatusCode };
        }
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    await exports.register();
    expect(calls).toEqual(
      env.NEXT_RUNTIME !== "nodejs"
        ? []
        : "OTEL_EXPORTER_OTLP_ENDPOINT" in env ||
            "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT" in env
          ? ["tracing", "flags"]
          : ["flags"],
    );
    if (calls.includes("tracing")) {
      expect(options).toEqual([
        {
          instrumentationConfig: {
            fetch: {
              propagateContextUrls: [
                "http://api.railway.internal:8080/",
                "https://api.example.com/",
              ],
            },
          },
        },
      ]);
    }
  }
});

test("logged errors are recorded on the active span", async () => {
  const recorded: unknown[] = [];
  const statuses: unknown[] = [];
  const span = {
    recordException: (e: unknown) => recorded.push(e),
    setStatus: (s: unknown) => statuses.push(s),
  };
  const sandbox = {
    exports: {} as { register: () => Promise<void> },
    Error,
    JSON,
    String,
    process: {
      env: { NEXT_RUNTIME: "nodejs", OTEL_EXPORTER_OTLP_ENDPOINT: "http://c" },
    },
    console: { error() {} },
    require: (name: string) => {
      if (name === "@vercel/otel") return { registerOTel() {} };
      if (name === "railway") return { flags: { init: async () => {} } };
      if (name === "@opentelemetry/api") {
        return { trace: { getActiveSpan: () => span }, SpanStatusCode };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  } as Record<string, unknown> & {
    exports: { register: () => Promise<void> };
    __jbclRecordSpanError?: (message: string, error?: unknown) => void;
  };
  runInNewContext(source, sandbox);
  await sandbox.exports.register();

  const err = new Error("boom");
  sandbox.__jbclRecordSpanError!("[API] failed", err);
  sandbox.__jbclRecordSpanError!("[API] fetch failed", { status: 500 });
  expect(recorded).toEqual([
    err,
    { name: "LoggedError", message: '[API] fetch failed {"status":500}' },
  ]);
  expect(statuses).toEqual([
    { code: SpanStatusCode.ERROR, message: "[API] failed" },
    { code: SpanStatusCode.ERROR, message: "[API] fetch failed" },
  ]);
});

test("request errors log searchable details without headers or query strings", () => {
  const logs: string[] = [];
  const exports = {} as {
    onRequestError: typeof import("./instrumentation").onRequestError;
  };
  runInNewContext(source, {
    exports,
    Error,
    console: { error: (line: string) => logs.push(line) },
  });
  const error = Object.assign(new Error("Upstream request failed"), {
    digest: "1458543801",
  });
  const request = {
    path: "/users/123?token=private-query",
    method: "GET",
    headers: {
      authorization: "Bearer private-token",
      cookie: "private-cookie",
    },
  };
  const context = {
    routerKind: "App Router",
    routePath: "/users/[id]",
    routeType: "render",
    renderSource: "react-server-components",
    revalidateReason: undefined,
    renderType: "dynamic",
  } as const;

  exports.onRequestError(error, request, context);
  expect(logs).toHaveLength(1);
  expect(JSON.parse(logs[0])).toEqual({
    level: "error",
    event: "next-request-error",
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    pathname: "/users/123",
    method: "GET",
    route: "/users/[id]",
    routeType: "render",
  });
  expect(logs[0]).not.toContain("private-");

  for (const thrown of ["Non-Error failure", null]) {
    exports.onRequestError(thrown, request, context);
    const record = JSON.parse(logs[logs.length - 1]);
    expect(record.message).toBe(String(thrown));
    expect(record).not.toHaveProperty("stack");
    expect(record).not.toHaveProperty("digest");
  }
});
