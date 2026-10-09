import { expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import {
  DESKTOP_NAVIGATION_INIT_SCRIPT,
  DESKTOP_NAVIGATION_KEY,
  DESKTOP_SIDEBAR_COLLAPSED_KEY,
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
          expect([
            DESKTOP_NAVIGATION_KEY,
            DESKTOP_SIDEBAR_COLLAPSED_KEY,
          ]).toContain(key);
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

test("restores sidebar collapse before paint with safe defaults", () => {
  for (const [stored, expected] of [
    ["true", "true"],
    ["false", "false"],
    [null, "false"],
    ["invalid", "false"],
    [new Error("Storage blocked"), "false"],
  ] as const) {
    const attributes = new Map<string, string>();
    runInNewContext(DESKTOP_NAVIGATION_INIT_SCRIPT, {
      localStorage: {
        getItem(key: string) {
          if (stored instanceof Error) throw stored;
          return key === DESKTOP_SIDEBAR_COLLAPSED_KEY ? stored : "sidebar";
        },
      },
      document: {
        documentElement: {
          setAttribute: (name: string, value: string) =>
            attributes.set(name, value),
        },
      },
    });
    expect(attributes.get("data-desktop-sidebar-collapsed")).toBe(expected);
  }
});

test("navigation and collapse send local changes and apply realtime updates without sending them back", async () => {
  const { readFileSync } = await import("node:fs");
  const { ModuleKind, transpileModule } = await import("typescript");
  const browser = new EventTarget();
  let pendingSend: (() => void) | undefined;
  let timerId = 0;
  const timers = new Map<number, () => void>();
  Object.assign(browser, {
    setTimeout(callback: () => void, delay: number) {
      expect(delay).toBe(300);
      timers.set(++timerId, callback);
      pendingSend = callback;
      return timerId;
    },
    clearTimeout(id: number) {
      timers.delete(id);
    },
  });
  const dataset = {
    desktopNavigation: "sidebar",
    desktopSidebarCollapsed: "false",
  };
  const stored = new Map<string, string>();
  const outgoing: unknown[] = [];
  const exports = {} as typeof import("./desktopNavigation");
  let synced = false;
  const cached: Record<string, unknown> = {};
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
              getCachedPreference: (key: string) => cached[key],
              hasSyncedPreferences: () => synced,
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
  expect(changes).toBe(5);
  exports.setDesktopSidebarCollapsed(true);
  expect(exports.getDesktopSidebarCollapsed()).toBe(true);
  expect(stored.get(DESKTOP_SIDEBAR_COLLAPSED_KEY)).toBe("true");
  exports.setDesktopSidebarCollapsed(false);
  expect(exports.getDesktopSidebarCollapsed()).toBe(false);
  exports.setDesktopSidebarCollapsed(true);
  expect(exports.getDesktopSidebarCollapsed()).toBe(true);
  expect(outgoing).toHaveLength(1);
  expect(timers.size).toBe(1);
  pendingSend?.();
  expect(outgoing[1]).toEqual({
    key: "desktop_sidebar_collapsed",
    value: true,
  });
  // A reply to the previous save must not undo a newer click awaiting debounce.
  exports.setDesktopSidebarCollapsed(false);
  browser.dispatchEvent(
    new CustomEvent("realtimePreference", {
      detail: { key: "desktop_sidebar_collapsed", value: true },
    }),
  );
  expect(exports.getDesktopSidebarCollapsed()).toBe(false);
  expect(stored.get(DESKTOP_SIDEBAR_COLLAPSED_KEY)).toBe("false");
  browser.dispatchEvent(
    new CustomEvent("realtimePreferences", {
      detail: {
        desktop_navigation: "top-bar",
        desktop_sidebar_collapsed: true,
      },
    }),
  );
  expect(exports.getDesktopNavigation()).toBe("top-bar");
  expect(exports.getDesktopSidebarCollapsed()).toBe(false);
  exports.setDesktopSidebarCollapsed(true);
  browser.dispatchEvent(
    new CustomEvent("realtimePreferenceDeleted", {
      detail: { key: "desktop_sidebar_collapsed" },
    }),
  );
  expect(exports.getDesktopSidebarCollapsed()).toBe(true);
  expect(outgoing).toHaveLength(2);
  pendingSend?.();
  expect(outgoing[2]).toEqual({
    key: "desktop_sidebar_collapsed",
    value: true,
  });

  for (const [value, expected] of [
    [false, false],
    [true, true],
    ["true", false],
  ] as const) {
    browser.dispatchEvent(
      new CustomEvent("realtimePreference", {
        detail: { key: "desktop_sidebar_collapsed", value },
      }),
    );
    expect(exports.getDesktopSidebarCollapsed()).toBe(expected);
  }
  browser.dispatchEvent(
    new CustomEvent("realtimePreferences", {
      detail: {
        desktop_navigation: "sidebar",
        desktop_sidebar_collapsed: true,
      },
    }),
  );
  expect(exports.getDesktopSidebarCollapsed()).toBe(true);
  browser.dispatchEvent(
    new CustomEvent("realtimePreferenceDeleted", {
      detail: { key: "desktop_sidebar_collapsed" },
    }),
  );
  expect(exports.getDesktopSidebarCollapsed()).toBe(false);
  expect(stored.get(DESKTOP_SIDEBAR_COLLAPSED_KEY)).toBe("false");
  expect(outgoing).toHaveLength(3);
  cleanup();
  unsubscribe();
  browser.dispatchEvent(
    new CustomEvent("realtimePreferences", {
      detail: { desktop_navigation: "top-bar" },
    }),
  );
  expect(exports.getDesktopNavigation()).toBe("sidebar");
  cached.desktop_sidebar_collapsed = true;
  synced = true;
  const cleanupCached = exports.syncDesktopNavigationPreferences();
  expect(exports.getDesktopSidebarCollapsed()).toBe(true);
  expect(outgoing).toHaveLength(3);
  cleanupCached();
});
