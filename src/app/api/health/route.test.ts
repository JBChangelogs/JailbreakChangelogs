import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { GET } from "./route";
import { GET as getAvailability } from "../healthcheck/route";

const originalEnv = { ...process.env };
// Mock the callable API, without Bun's additional fetch.preconnect property.
const fetchTarget = globalThis as {
  fetch: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;
};
let fetchSpy: ReturnType<typeof spyOn<typeof fetchTarget, "fetch">>;

beforeEach(() => {
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  process.env.RAILWAY_INTERNAL_API_URL = "http://backend.internal:8000/";
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  fetchSpy = spyOn(fetchTarget, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
  for (const name of [
    "RAILWAY_ENVIRONMENT_NAME",
    "RAILWAY_INTERNAL_API_URL",
    "NEXT_PUBLIC_API_URL",
  ]) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

test("checks both API connections and returns uncached diagnostics", async () => {
  fetchSpy.mockImplementation(async () => Response.json({ status: "ok" }));
  const response = await GET();
  const report = await response.json();

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(report.status).toBe("ok");
  expect(report.app_version).toBeString();
  expect(report.instance).toBeString();
  expect(report.checked_at).toBeGreaterThan(0);
  expect(report.memory.rss_bytes).toBeGreaterThan(0);
  expect(report.checks.api_server.ok).toBe(true);
  expect(report.checks.api_public.ok).toBe(true);
  expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
    "http://backend.internal:8000/health",
    "https://api.example.com/health",
  ]);
  for (const [, options] of fetchSpy.mock.calls) {
    expect(options?.cache).toBe("no-store");
    expect(options?.redirect).toBe("error");
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  }
  expect(JSON.stringify(report)).not.toContain("backend.internal");
});

test("reports degradation for failed, degraded, or invalid upstream responses", async () => {
  for (const upstream of [
    () => Response.json({ status: "down" }, { status: 503 }),
    () => Response.json({ status: "degraded" }),
    () => Response.json({ status: "down" }),
    () => Response.json({}),
    () => Response.json(null),
    () => new Response("not JSON"),
  ]) {
    fetchSpy.mockImplementation(async (url) =>
      String(url).includes("backend.internal")
        ? upstream()
        : Response.json({ status: "ok" }),
    );
    const response = await GET();
    const report = await response.json();
    expect(response.status).toBe(503);
    expect(report.status).toBe("degraded");
    expect(report.checks.api_server.ok).toBe(false);
    expect(report.checks.api_public.ok).toBe(true);
  }
});

test("fails independently when only the public API connection breaks", async () => {
  fetchSpy.mockImplementation(async (url) => {
    if (!String(url).includes("backend.internal")) {
      throw new Error("secret connection details");
    }
    return Response.json({ status: "ok" });
  });
  const response = await GET();
  const report = await response.json();
  expect(response.status).toBe(503);
  expect(report.checks.api_server.ok).toBe(true);
  expect(report.checks.api_public.error).toBe("request_failed");
  expect(JSON.stringify(report)).not.toContain("secret");
});

test("uses the public API outside production and fails on missing configuration", async () => {
  process.env.RAILWAY_ENVIRONMENT_NAME = "testing";
  fetchSpy.mockImplementation(async () => Response.json({ status: "ok" }));
  expect((await GET()).status).toBe(200);
  expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
    "https://api.example.com/health",
    "https://api.example.com/health",
  ]);

  delete process.env.NEXT_PUBLIC_API_URL;
  const response = await GET();
  const report = await response.json();
  expect(response.status).toBe(503);
  expect(report.checks.api_server.error).toBe("not_configured");
  expect(report.checks.api_public.error).toBe("not_configured");
});

test("reports slow successful probes as degraded", async () => {
  fetchSpy.mockImplementation(async () => {
    await Bun.sleep(1_550);
    return Response.json({ status: "ok" });
  });
  const response = await GET();
  const report = await response.json();
  expect(response.status).toBe(503);
  expect(report.checks.api_server.error).toBe("slow_response");
});

test("bounds stalled probes with concurrent three-second timeouts", async () => {
  fetchSpy.mockImplementation(
    async (_url, options) =>
      new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => {
          reject(options.signal?.reason);
        });
      }),
  );
  const started = performance.now();
  const response = await GET();
  const report = await response.json();
  expect(response.status).toBe(503);
  expect(report.checks.api_server.error).toBe("timeout");
  expect(report.checks.api_public.error).toBe("timeout");
  expect(performance.now() - started).toBeLessThan(4_500);
}, 5_000);

test("Railway availability remains independent of backend health", async () => {
  fetchSpy.mockImplementation(async () => {
    throw new Error("backend down");
  });
  const response = getAvailability();
  expect(response.status).toBe(200);
  expect(fetchSpy).not.toHaveBeenCalled();
});
