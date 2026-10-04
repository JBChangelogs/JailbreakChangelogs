import { expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import {
  DESKTOP_NAVIGATION_INIT_SCRIPT,
  DESKTOP_NAVIGATION_KEY,
} from "./desktopNavigation";

test("restores navigation before paint and falls back safely for invalid or unavailable storage", () => {
  for (const [stored, expected] of [
    ["top-bar", "top-bar"],
    ["sidebar", "sidebar"],
    [null, "sidebar"],
    ["invalid", "sidebar"],
    [new Error("Storage blocked"), "sidebar"],
  ] as const) {
    const attributes = new Map<string, string>();
    runInNewContext(DESKTOP_NAVIGATION_INIT_SCRIPT, {
      localStorage: {
        getItem(key: string) {
          expect(key).toBe(DESKTOP_NAVIGATION_KEY);
          if (stored instanceof Error) throw stored;
          return stored;
        },
      },
      document: {
        documentElement: {
          setAttribute: (name: string, value: string) =>
            attributes.set(name, value),
        },
      },
    });
    expect(attributes.get("data-desktop-navigation")).toBe(expected);
  }
});

test("navigation sends local changes and applies realtime updates without sending them back", async () => {
  const { readFileSync } = await import("node:fs");
  const { ModuleKind, transpileModule } = await import("typescript");
  const browser = new EventTarget();
  const dataset = { desktopNavigation: "sidebar" };
  const stored = new Map<string, string>();
  const outgoing: unknown[] = [];
  const exports = {} as typeof import("./desktopNavigation");
  browser.addEventListener("sendRealtimePreference", (event) => {
    outgoing.push((event as CustomEvent).detail);
  });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./desktopNavigation.ts", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      Event,
      CustomEvent,
      window: browser,
      document: { documentElement: { dataset } },
      require: (id: string) =>
        id.includes("safeStorage")
          ? {
              safeLocalStorage: {
                setItem: (key: string, value: string) => stored.set(key, value),
              },
            }
          : {
              getCachedPreference: () => undefined,
              hasSyncedPreferences: () => false,
            },
    },
  );
  const cleanup = exports.syncDesktopNavigationPreferences();
  let changes = 0;
  const unsubscribe = exports.subscribeDesktopNavigation(() => changes++);
  exports.setDesktopNavigation("top-bar");
  expect(dataset.desktopNavigation).toBe("top-bar");
  expect(stored.get(DESKTOP_NAVIGATION_KEY)).toBe("top-bar");
  expect(outgoing).toEqual([{ key: "desktop_navigation", value: "top-bar" }]);

  browser.dispatchEvent(
    new CustomEvent("realtimePreference", {
      detail: { key: "desktop_navigation", value: "sidebar" },
    }),
  );
  expect(exports.getDesktopNavigation()).toBe("sidebar");
  browser.dispatchEvent(
    new CustomEvent("realtimePreferences", {
      detail: { desktop_navigation: "top-bar" },
    }),
  );
  expect(exports.getDesktopNavigation()).toBe("top-bar");
  browser.dispatchEvent(
    new CustomEvent("realtimePreferenceDeleted", {
      detail: { key: "desktop_navigation" },
    }),
  );
  expect(exports.getDesktopNavigation()).toBe("sidebar");
  expect(outgoing).toHaveLength(1);
  expect(changes).toBe(4);
  cleanup();
  unsubscribe();
  browser.dispatchEvent(
    new CustomEvent("realtimePreferences", {
      detail: { desktop_navigation: "top-bar" },
    }),
  );
  expect(exports.getDesktopNavigation()).toBe("sidebar");
});
