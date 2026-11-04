import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

for (const [module, key, storageKey, getter, setter, subscribe, sync] of [
  [
    "themeCursor",
    "theme_cursor_enabled",
    "theme-cursor-enabled",
    "getThemeCursorEnabled",
    "setThemeCursorEnabled",
    "subscribeThemeCursor",
    "syncThemeCursorPreferences",
  ],
  [
    "themeOptions",
    "theme_shortcut_hidden",
    "theme-shortcut-hidden",
    "getThemeShortcutHidden",
    "setThemeShortcutHidden",
    "subscribeThemeShortcut",
    "syncThemeShortcutPreferences",
  ],
]) {
  test(`${module} keeps local toggles and applies account updates, snapshots and deletion without echoing`, () => {
    const browser = new EventTarget();
    const stored = new Map<string, string>();
    const outgoing: unknown[] = [];
    let synced = false;
    let cached: unknown = true;
    const exports: Record<string, unknown> = {};
    browser.addEventListener("sendRealtimePreference", (event) =>
      outgoing.push((event as CustomEvent).detail),
    );
    runInNewContext(
      transpileModule(
        readFileSync(new URL(`./${module}.ts`, import.meta.url), "utf8"),
        { compilerOptions: { module: ModuleKind.CommonJS } },
      ).outputText,
      {
        exports,
        Event,
        CustomEvent,
        window: browser,
        document: { documentElement: { dataset: { themeCursor: "off" } } },
        require: (name: string) =>
          name.includes("safeStorage")
            ? {
                safeLocalStorage: {
                  getItem: (key: string) => stored.get(key) ?? null,
                  setItem: (key: string, value: string) =>
                    stored.set(key, value),
                },
              }
            : {
                hasSyncedPreferences: () => synced,
                getCachedPreference: () => cached,
              },
      },
    );
    const get = exports[getter] as () => boolean;
    const set = exports[setter] as (value: boolean) => void;
    const listen = exports[subscribe] as (onChange: () => void) => () => void;
    const startSync = exports[sync] as () => () => void;
    const send = (type: string, detail: unknown) =>
      browser.dispatchEvent(new CustomEvent(type, { detail }));
    const cleanup = startSync();
    let updates = 0;
    const unsubscribe = listen(() => updates++);
    expect(get()).toBe(false);
    set(true);
    expect(get()).toBe(true);
    expect(stored.get(storageKey)).toBe("true");
    expect(updates).toBe(1);
    expect(outgoing).toEqual([{ key, value: true }]);
    set(false);
    expect(get()).toBe(false);
    expect(outgoing).toEqual([
      { key, value: true },
      { key, value: false },
    ]);
    send("realtimePreference", { key, value: true });
    expect(get()).toBe(true);
    send("realtimePreference", { key: "other", value: false });
    send("realtimePreference", { key, value: "false" });
    send("realtimePreferenceDeleted", { key: "other" });
    expect(get()).toBe(true);
    send("realtimePreference", { key, value: false });
    expect(get()).toBe(false);
    send("realtimePreferences", { [key]: true });
    expect(get()).toBe(true);
    send("realtimePreferences", {});
    expect(get()).toBe(false);
    send("realtimePreferences", { [key]: true });
    send("realtimePreferenceDeleted", { key });
    expect(get()).toBe(false);
    expect(stored.get(storageKey)).toBe("false");
    expect(outgoing).toHaveLength(2);
    cleanup();
    unsubscribe();
    const previousUpdates = updates;
    send("realtimePreferences", { [key]: true });
    expect(get()).toBe(false);
    synced = true;
    const cleanupCached = startSync();
    expect(get()).toBe(true);
    expect(updates).toBe(previousUpdates);
    cleanupCached();
    cached = undefined;
    const cleanupDefault = startSync();
    expect(get()).toBe(false);
    cleanupDefault();
  });
}
