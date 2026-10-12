import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const originalApiUrl = process.env.RYBBIT_API_URL;
const fetchTarget = globalThis as {
  fetch: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;
};
let fetchSpy: ReturnType<typeof spyOn<typeof fetchTarget, "fetch">>;

beforeEach(() => {
  process.env.RYBBIT_API_URL = "http://rybbit-server.railway.internal:3001/api";
  fetchSpy = spyOn(fetchTarget, "fetch");
  fetchSpy.mockImplementation(async () => new Response("ok"));
});

afterEach(() => {
  fetchSpy.mockRestore();
  if (originalApiUrl === undefined) delete process.env.RYBBIT_API_URL;
  else process.env.RYBBIT_API_URL = originalApiUrl;
});

test("relays visitor IP and browser headers privately without forwarding site credentials", async () => {
  const body = JSON.stringify({ site_id: "test", type: "pageview" });
  const request = new NextRequest("https://example.com/insights/track?test=1", {
    method: "POST",
    body,
    headers: {
      "cf-connecting-ip": "203.0.113.42",
      "x-forwarded-for": "192.0.2.10, 192.0.2.11",
      "x-real-ip": "192.0.2.12",
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 Chrome/140.0.0.0",
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "sec-fetch-user": "?1",
      cookie: "token=private",
      authorization: "Bearer private",
      host: "example.com",
      connection: "keep-alive",
    },
  });
  await POST(request, { params: Promise.resolve({ path: ["track"] }) });
  const [url, options] = fetchSpy.mock.calls[0];
  expect(String(url)).toBe(
    "http://rybbit-server.railway.internal:3001/api/track?test=1",
  );
  expect(options?.method).toBe("POST");
  expect(new TextDecoder().decode(options?.body as ArrayBuffer)).toBe(body);
  expect(options?.cache).toBe("no-store");
  const headers = options?.headers as Headers;
  expect(headers.get("x-forwarded-for")).toBe("203.0.113.42");
  expect(headers.get("x-real-ip")).toBe("203.0.113.42");
  for (const name of [
    "content-type",
    "user-agent",
    "accept",
    "accept-language",
    "accept-encoding",
    "sec-fetch-site",
    "sec-fetch-mode",
    "sec-fetch-dest",
    "sec-fetch-user",
  ]) {
    expect(headers.get(name)).toBe(request.headers.get(name));
  }
  for (const name of ["cookie", "authorization", "host", "connection"]) {
    expect(headers.has(name)).toBe(false);
  }
});

test("retains IP fallbacks for requests without Cloudflare headers", async () => {
  for (const [inputHeaders, expectedIp] of [
    [{ "x-forwarded-for": " 203.0.113.10, 192.0.2.1" }, "203.0.113.10"],
    [{ "x-real-ip": "203.0.113.11" }, "203.0.113.11"],
    [{}, null],
  ] as const) {
    await GET(
      new NextRequest("https://example.com/insights/script.js", {
        headers: inputHeaders,
      }),
      { params: Promise.resolve({ path: ["script.js"] }) },
    );
    const headers = fetchSpy.mock.calls.at(-1)?.[1]?.headers as Headers;
    expect(headers.get("x-real-ip")).toBe(expectedIp);
    expect(headers.get("x-forwarded-for")).toBe(expectedIp);
  }
});

test("keeps the public fallback and preserves upstream responses", async () => {
  delete process.env.RYBBIT_API_URL;
  fetchSpy.mockImplementation(
    async () =>
      new Response("upstream failure", {
        status: 503,
        headers: {
          "content-type": "text/plain",
          "content-encoding": "gzip",
          "content-length": "99",
          "transfer-encoding": "chunked",
        },
      }),
  );
  const response = await GET(
    new NextRequest("https://example.com/insights/site/tracking-config/test"),
    { params: Promise.resolve({ path: ["site", "tracking-config", "test"] }) },
  );
  const [url, options] = fetchSpy.mock.calls[0];
  expect(String(url)).toBe(
    "https://rybbit-api.jailbreakchangelogs.com/api/site/tracking-config/test",
  );
  expect(options?.body).toBeUndefined();
  expect(response.status).toBe(503);
  expect(await response.text()).toBe("upstream failure");
  expect(response.headers.get("content-type")).toBe("text/plain");
  for (const name of [
    "content-encoding",
    "content-length",
    "transfer-encoding",
  ]) {
    expect(response.headers.has(name)).toBe(false);
  }
});
