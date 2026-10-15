import { expect, test } from "bun:test";

test("recent shared themes: newest first, capped, deduped and synced", async () => {
  const stored = new Map<string, string>();
  const sent: unknown[] = [];
  const browser = new EventTarget();
  const before = {
    window: (globalThis as { window?: unknown }).window,
    localStorage: (globalThis as { localStorage?: unknown }).localStorage,
  };
  browser.addEventListener("sendRealtimePreference", (event) =>
    sent.push((event as CustomEvent).detail),
  );
  Object.assign(globalThis, {
    window: browser,
    localStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
    },
  });
  const recent = await import("./recentThemes");

  expect(recent.parseRecentThemes("K7QM4XRP,bad,K7QM4XRP,ABCD2345")).toEqual([
    "K7QM4XRP",
    "ABCD2345",
  ]);
  expect(recent.parseRecentThemes(["K7QM4XRP"])).toEqual([]);

  const codes = ["AAAA2222", "BBBB2222", "CCCC2222", "DDDD2222", "EEEE2222"];
  for (const code of codes) recent.rememberSharedTheme(code);
  recent.rememberSharedTheme("FFFF2222");
  recent.rememberSharedTheme("CCCC2222");
  expect(recent.getRecentThemes()).toEqual([
    "CCCC2222",
    "FFFF2222",
    "EEEE2222",
    "DDDD2222",
    "BBBB2222",
  ]);

  recent.forgetSharedTheme("FFFF2222");
  expect(sent.at(-1)).toEqual({
    key: "recent_custom_themes",
    value: "CCCC2222,EEEE2222,DDDD2222,BBBB2222",
  });

  // Another device's list replaces this one; a deleted preference empties it.
  const cleanup = recent.syncRecentThemesPreferences();
  browser.dispatchEvent(
    new CustomEvent("realtimePreference", {
      detail: { key: "recent_custom_themes", value: "K7QM4XRP" },
    }),
  );
  expect(recent.getRecentThemes()).toEqual(["K7QM4XRP"]);
  browser.dispatchEvent(
    new CustomEvent("realtimePreferenceDeleted", {
      detail: { key: "recent_custom_themes" },
    }),
  );
  expect(recent.getRecentThemes()).toEqual([]);
  expect(stored.has("recent_custom_themes")).toBe(false);
  cleanup();
  // Other test files share this process; put the globals back.
  for (const [key, value] of Object.entries(before)) {
    if (value === undefined)
      delete (globalThis as Record<string, unknown>)[key];
    else Object.assign(globalThis, { [key]: value });
  }
});
