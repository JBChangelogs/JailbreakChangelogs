import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("tracing initializes only with a Node collector and preserves Railway flag initialization", async () => {
  const source = transpileModule(
    readFileSync(new URL("./instrumentation.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS } },
  ).outputText;

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
