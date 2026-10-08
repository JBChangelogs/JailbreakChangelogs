import { expect, test } from "bun:test";
import { fetchAppAccess } from "./access";

test("desktop access requires treatment from a fresh authenticated experiment response", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  const signal = new AbortController().signal;
  let response = new Response();
  let networkError = false;
  globalThis.fetch = (async (url, options) => {
    if (networkError) throw new Error("Network error");
    expect(String(url)).toEndWith("/v2/users/me/experiments");
    expect(options?.credentials).toBe("include");
    expect(options?.cache).toBe("no-store");
    expect(options?.signal).toBe(signal);
    return response;
  }) as typeof fetch;
  try {
    for (const [experiments, allowed] of [
      [{ app_available: "treatment" }, true],
      [{ app_available: "control" }, false],
      [{ app_available: "unknown" }, false],
      [{}, false],
    ] as const) {
      response = Response.json({ experiments, descriptions: {} });
      expect(await fetchAppAccess(signal)).toBe(allowed);
    }
    for (const status of [401, 403, 500]) {
      response = new Response(null, { status });
      await expect(fetchAppAccess(signal)).rejects.toThrow(
        "Couldn't check your access",
      );
    }
    response = Response.json({ app_available: "treatment" });
    await expect(fetchAppAccess(signal)).rejects.toThrow(
      "invalid experiment response",
    );
    response = Response.json({ experiments: { app_available: true } });
    await expect(fetchAppAccess(signal)).rejects.toThrow(
      "invalid experiment response",
    );
    networkError = true;
    await expect(fetchAppAccess(signal)).rejects.toThrow("Network error");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  }
});
