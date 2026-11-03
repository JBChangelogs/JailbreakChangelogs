import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

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
