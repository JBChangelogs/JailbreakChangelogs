import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { TAB_STYLE_INIT_SCRIPT } from "./tabStyle";

test("tab style restores before paint with safe defaults for missing, invalid or blocked storage", () => {
  for (const [stored, expected] of [
    ["filled", "filled"],
    ["underline", "underline"],
    [null, "underline"],
    ["invalid", "underline"],
    [new Error("Storage blocked"), "underline"],
  ] as const) {
    const attributes = new Map<string, string>();
    runInNewContext(TAB_STYLE_INIT_SCRIPT, {
      localStorage: {
        getItem: () => {
          if (stored instanceof Error) throw stored;
          return stored;
        },
      },
      document: {
        documentElement: {
          setAttribute: (key: string, value: string) =>
            attributes.set(key, value),
        },
      },
    });
    expect(attributes.get("data-tab-style")).toBe(expected);
  }
});

test("tab style saves locally, sends changes, applies realtime sync and cleans up", () => {
  const browser = new EventTarget();
  const dataset = { tabStyle: "underline" };
  const stored = new Map<string, string>();
  const outgoing: unknown[] = [];
  let synced = false;
  const cached = "filled";
  const exports = {} as typeof import("./tabStyle");
  browser.addEventListener("sendRealtimePreference", (event) => {
    outgoing.push((event as CustomEvent).detail);
  });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./tabStyle.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      Event,
      CustomEvent,
      window: browser,
      document: { documentElement: { dataset } },
      require: (name: string) =>
        name.includes("safeStorage")
          ? {
              safeLocalStorage: {
                setItem: (key: string, value: string) => stored.set(key, value),
              },
            }
          : {
              hasSyncedPreferences: () => synced,
              getCachedPreference: () => cached,
            },
    },
  );
  const cleanup = exports.syncTabStylePreferences();
  let changes = 0;
  const unsubscribe = exports.subscribeTabStyle(() => changes++);
  exports.setTabStyle("filled");
  expect(exports.getTabStyle()).toBe("filled");
  expect(stored.get("tab_style")).toBe("filled");
  expect(outgoing).toEqual([{ key: "tab_style", value: "filled" }]);
  const send = (type: string, detail: unknown) =>
    browser.dispatchEvent(new CustomEvent(type, { detail }));
  send("realtimePreference", { key: "theme", value: "underline" });
  send("realtimePreference", { key: "tab_style", value: "invalid" });
  expect(exports.getTabStyle()).toBe("filled");
  send("realtimePreference", { key: "tab_style", value: "underline" });
  expect(exports.getTabStyle()).toBe("underline");
  send("realtimePreferences", { tab_style: "filled" });
  expect(exports.getTabStyle()).toBe("filled");
  send("realtimePreferenceDeleted", { key: "tab_style" });
  expect(exports.getTabStyle()).toBe("underline");
  expect(stored.get("tab_style")).toBe("underline");
  send("realtimePreferences", { tab_style: "filled" });
  send("realtimePreferences", {});
  expect(exports.getTabStyle()).toBe("underline");
  expect(outgoing).toHaveLength(1);
  expect(changes).toBe(6);
  cleanup();
  unsubscribe();
  send("realtimePreferences", { tab_style: "filled" });
  expect(exports.getTabStyle()).toBe("underline");
  synced = true;
  const cleanupCached = exports.syncTabStylePreferences();
  expect(exports.getTabStyle()).toBe("filled");
  cleanupCached();
});
