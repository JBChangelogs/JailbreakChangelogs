import { afterEach, expect, spyOn, test } from "bun:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

const service = {} as typeof import("./settingsService");
const require = createRequire(import.meta.url);
runInNewContext(
  transpileModule(
    readFileSync(new URL("./settingsService.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS } },
  ).outputText,
  {
    exports: service,
    require: (name: string) =>
      name === "@/utils/api/api"
        ? { ...require(name), PUBLIC_API_URL: "https://api.example.com" }
        : require(name),
    fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
  },
);
const { fetchAccentColor, saveAccentColor } = service;

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("loads the v2 custom accent for the picker, including unset and black", async () => {
  const fetchMock = spyOn(globalThis, "fetch");
  for (const color of [null, "#Ab12Cd", "#000000"]) {
    fetchMock.mockResolvedValueOnce(Response.json({ color }));
    expect(await fetchAccentColor()).toEqual(
      color
        ? { color: color.toLowerCase(), gradient: null, style: "solid" }
        : null,
    );
  }
  for (const [url, options] of fetchMock.mock.calls) {
    expect(String(url)).toEndWith("/v2/users/me/accent-color");
    expect(options?.credentials).toBe("include");
    expect(options?.cache).toBe("no-store");
  }
});

test("saves the full accent and resets with an authenticated DELETE without a body", async () => {
  const accent = { color: "#123abc", gradient: null, style: "solid" as const };
  const fetchMock = spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json(accent))
    .mockResolvedValueOnce(Response.json({ color: null }));

  await saveAccentColor(accent);
  await saveAccentColor(null);

  const [save, reset] = fetchMock.mock.calls;
  expect(String(save[0])).toEndWith("/v2/users/me/accent-color");
  expect(save[1]?.method).toBe("PUT");
  expect(save[1]?.credentials).toBe("include");
  expect(new Headers(save[1]?.headers).get("Content-Type")).toBe(
    "application/json",
  );
  expect(JSON.parse(save[1]?.body as string)).toEqual(accent);
  expect(reset[0]).toBe(save[0]);
  expect(reset[1]?.method).toBe("DELETE");
  expect(reset[1]?.credentials).toBe("include");
  expect(reset[1]?.body).toBeUndefined();
});

test("surfaces supporter and rate limit failures when saving", async () => {
  const fetchMock = spyOn(globalThis, "fetch");
  const accent = { color: "#123abc", gradient: null, style: "solid" as const };
  fetchMock.mockResolvedValueOnce(
    Response.json({ error: "supporter_required" }, { status: 403 }),
  );
  await expect(saveAccentColor(accent)).rejects.toThrow("supporter tier");
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 429 }));
  await expect(saveAccentColor(accent)).rejects.toThrow(
    "Try again in a minute",
  );
});
