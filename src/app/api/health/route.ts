import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { version } from "../../../../package.json";

const instance = randomUUID();
const timeoutMs = 3_000;
const slowMs = 1_500;

async function checkApi(baseUrl: string | undefined) {
  const started = performance.now();
  let httpStatus: number | undefined;
  let upstreamStatus: string | undefined;
  let error: string | undefined;

  try {
    if (!baseUrl) {
      error = "not_configured";
    } else {
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/health`, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: "application/json" },
      });
      httpStatus = response.status;
      if (!response.ok) {
        error = "http_error";
        await response.body?.cancel();
      } else {
        const report: unknown = await response.json();
        if (
          report &&
          typeof report === "object" &&
          "status" in report &&
          typeof report.status === "string"
        ) {
          upstreamStatus = report.status;
        }
        if (upstreamStatus !== "ok") error = "upstream_unhealthy";
      }
    }
  } catch (cause) {
    error =
      cause instanceof Error &&
      (cause.name === "TimeoutError" || cause.name === "AbortError")
        ? "timeout"
        : "request_failed";
  }

  const latencyMs = Math.round((performance.now() - started) * 10) / 10;
  if (!error && latencyMs >= slowMs) error = "slow_response";

  return {
    ok: !error,
    latency_ms: latencyMs,
    http_status: httpStatus,
    upstream_status: upstreamStatus,
    error,
  };
}

export async function GET() {
  const started = performance.now();
  // Match the API selection used by SSR and proxy.ts.
  const serverApiUrl =
    process.env.RAILWAY_ENVIRONMENT_NAME === "production"
      ? process.env.RAILWAY_INTERNAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL;
  const [apiServer, apiPublic] = await Promise.all([
    checkApi(serverApiUrl),
    checkApi(process.env.NEXT_PUBLIC_API_URL),
  ]);
  const status = apiServer.ok && apiPublic.ok ? "ok" : "degraded";
  const memory = process.memoryUsage();

  return NextResponse.json(
    {
      status,
      app_version: version,
      deployment: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
      instance,
      checked_at: Math.floor(Date.now() / 1_000),
      duration_ms: Math.round((performance.now() - started) * 10) / 10,
      uptime_seconds: Math.floor(process.uptime()),
      checks: { api_server: apiServer, api_public: apiPublic },
      memory: {
        rss_bytes: memory.rss,
        heap_used_bytes: memory.heapUsed,
        heap_total_bytes: memory.heapTotal,
      },
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
