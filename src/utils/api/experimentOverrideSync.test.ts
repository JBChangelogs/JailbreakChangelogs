import { afterEach, expect, test } from "bun:test";
import {
  overridesFromPreferences,
  writeSyncedOverrides,
} from "./experimentOverrideSync";

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
});

test("reads only experiment overrides from realtime preferences", () => {
  expect(
    overridesFromPreferences({
      theme: "dark",
      "experiment_override:item_search": "treatment",
      "experiment_override:trade_ads": "control",
      "experiment_override:bad key": "treatment",
      "experiment_override:other": "unknown",
      "experiment_override:object": { variant: "treatment" },
    }),
  ).toEqual({ item_search: "treatment", trade_ads: "control" });
});

test("syncs overrides key by key, never deleting every preference", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  const calls: [string, string, unknown][] = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([
      init?.method ?? "GET",
      String(url),
      init?.body ? JSON.parse(String(init.body)) : undefined,
    ]);
    return new Response(null, { status: 204 });
  }) as typeof fetch;

  await writeSyncedOverrides(
    { kept: "treatment", changed: "control", added: "treatment" },
    { kept: "treatment", changed: "treatment", removed: "control" },
  );
  const base = "https://api.example.com/v2/users/me/realtime-preferences";
  expect(calls.sort()).toEqual(
    (
      [
        ["DELETE", `${base}/experiment_override:removed`, undefined],
        ["PUT", `${base}/experiment_override:added`, { value: "treatment" }],
        ["PUT", `${base}/experiment_override:changed`, { value: "control" }],
      ] as [string, string, unknown][]
    ).sort(),
  );

  // Clearing still deletes one key at a time.
  calls.length = 0;
  await writeSyncedOverrides({}, { a: "treatment", b: "control" });
  expect(calls.map(([method, url]) => [method, url]).sort()).toEqual([
    ["DELETE", `${base}/experiment_override:a`],
    ["DELETE", `${base}/experiment_override:b`],
  ]);
});
