import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

const KEY = "theme_competition_banner_enabled";
const code = transpileModule(
  readFileSync(new URL("./themeCompetitionBanner.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS } },
).outputText;

function harness(
  options: {
    saved?: string;
    cached?: unknown;
    synced?: boolean;
    blocked?: boolean;
  } = {},
) {
  const stored = new Map<string, string>();
  if (options.saved !== undefined) stored.set(KEY, options.saved);
  const browser = new EventTarget();
  const outgoing: unknown[] = [];
  browser.addEventListener("sendRealtimePreference", (event) =>
    outgoing.push((event as CustomEvent).detail),
  );
  const exports = {} as typeof import("./themeCompetitionBanner");
  runInNewContext(code, {
    exports,
    Event,
    CustomEvent,
    window: browser,
    require: (name: string) =>
      name.includes("safeStorage")
        ? {
            safeLocalStorage: {
              getItem: (key: string) =>
                options.blocked ? null : (stored.get(key) ?? null),
              setItem: (key: string, value: string) => {
                if (!options.blocked) stored.set(key, value);
                return !options.blocked;
              },
            },
          }
        : {
            getCachedPreference: () => options.cached,
            hasSyncedPreferences: () => options.synced ?? false,
          },
  });
  return {
    ...exports,
    stored,
    outgoing,
    send: (type: string, detail: unknown) =>
      browser.dispatchEvent(new CustomEvent(type, { detail })),
  };
}

test("competition banners default on and restore local or cached preferences", () => {
  for (const options of [
    {},
    { saved: "true" },
    { saved: "invalid" },
    { blocked: true },
  ])
    expect(harness(options).getThemeCompetitionBannerEnabled()).toBe(true);
  expect(harness({ saved: "false" }).getThemeCompetitionBannerEnabled()).toBe(
    false,
  );
  expect(
    harness({
      saved: "true",
      cached: false,
    }).getThemeCompetitionBannerEnabled(),
  ).toBe(false);
  const view = harness({ saved: "false", synced: true });
  const cleanup = view.syncThemeCompetitionBannerPreferences();
  expect(view.getThemeCompetitionBannerEnabled()).toBe(true);
  cleanup();
});

test("toggling updates subscribers immediately, persists across reloads and sends realtime preferences", () => {
  const view = harness();
  let updates = 0;
  const unsubscribe = view.subscribeThemeCompetitionBanner(() => updates++);
  view.setThemeCompetitionBannerEnabled(false);
  expect(view.getThemeCompetitionBannerEnabled()).toBe(false);
  expect(updates).toBe(1);
  expect(
    harness({ saved: view.stored.get(KEY) }).getThemeCompetitionBannerEnabled(),
  ).toBe(false);
  expect(view.outgoing).toEqual([{ key: KEY, value: false }]);
  view.setThemeCompetitionBannerEnabled(true);
  expect(view.getThemeCompetitionBannerEnabled()).toBe(true);
  expect(updates).toBe(2);
  unsubscribe();
  view.setThemeCompetitionBannerEnabled(false);
  expect(updates).toBe(2);
  const blocked = harness({ blocked: true });
  blocked.setThemeCompetitionBannerEnabled(false);
  expect(blocked.getThemeCompetitionBannerEnabled()).toBe(false);
});

test("realtime changes and snapshots apply without echoing, and deletion restores the default", () => {
  const view = harness();
  const cleanup = view.syncThemeCompetitionBannerPreferences();
  view.send("realtimePreference", { key: KEY, value: false });
  expect(view.getThemeCompetitionBannerEnabled()).toBe(false);
  view.send("realtimePreference", { key: "other", value: true });
  view.send("realtimePreference", { key: KEY, value: "false" });
  view.send("realtimePreferenceDeleted", { key: "other" });
  expect(view.getThemeCompetitionBannerEnabled()).toBe(false);
  view.send("realtimePreferenceDeleted", { key: KEY });
  expect(view.getThemeCompetitionBannerEnabled()).toBe(true);
  view.send("realtimePreferences", { [KEY]: false });
  expect(view.getThemeCompetitionBannerEnabled()).toBe(false);
  view.send("realtimePreferences", {});
  expect(view.getThemeCompetitionBannerEnabled()).toBe(true);
  expect(view.stored.get(KEY)).toBe("true");
  expect(view.outgoing).toEqual([]);
  cleanup();
  view.send("realtimePreferences", { [KEY]: false });
  expect(view.getThemeCompetitionBannerEnabled()).toBe(true);
  const cached = harness({ cached: false, synced: true });
  const cleanupCached = cached.syncThemeCompetitionBannerPreferences();
  expect(cached.getThemeCompetitionBannerEnabled()).toBe(false);
  cleanupCached();
});
