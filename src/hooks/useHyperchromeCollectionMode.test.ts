import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { useHyperchromeCollectionMode } from "./useHyperchromeCollectionMode";

test("collection mode remembers the choice, updates all views, and remains usable when storage is blocked", () => {
  let stored: string | null = "every-level";
  let storageBlocked = false;
  const browser = new EventTarget();
  let store: {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => boolean;
    getServerSnapshot: () => boolean;
  };
  const exports = {} as {
    useHyperchromeCollectionMode: typeof useHyperchromeCollectionMode;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useHyperchromeCollectionMode.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      window: browser,
      require: (name: string) => {
        if (name === "react")
          return {
            useSyncExternalStore: (
              subscribe: typeof store.subscribe,
              getSnapshot: typeof store.getSnapshot,
              getServerSnapshot: typeof store.getServerSnapshot,
            ) => {
              store = { subscribe, getSnapshot, getServerSnapshot };
              return getSnapshot();
            },
          };
        if (name === "@/utils/storage/safeStorage")
          return {
            safeLocalStorage: {
              getItem: () => stored,
              setItem: (key: string, value: string) => {
                expect(key).toBe("hyperchromeCollectionMode");
                if (storageBlocked) return false;
                stored = value;
                return true;
              },
            },
          };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const mode = exports.useHyperchromeCollectionMode();
  expect(mode.countLowerLevels).toBe(false);
  expect(store!.getServerSnapshot()).toBe(true);
  let previewUpdates = 0;
  let breakdownUpdates = 0;
  const unsubscribePreview = store!.subscribe(() => previewUpdates++);
  const unsubscribeBreakdown = store!.subscribe(() => breakdownUpdates++);
  mode.setCountLowerLevels(true);
  expect(stored).toBe("lower-levels");
  expect(store!.getSnapshot()).toBe(true);
  expect(previewUpdates).toBe(1);
  expect(breakdownUpdates).toBe(1);
  storageBlocked = true;
  mode.setCountLowerLevels(false);
  expect(store!.getSnapshot()).toBe(false);
  expect(stored).toBe("lower-levels");
  const storageEvent = (key: string | null) =>
    browser.dispatchEvent(Object.assign(new Event("storage"), { key }));
  stored = "every-level";
  storageEvent("hyperchromeCollectionMode");
  expect(store!.getSnapshot()).toBe(false);
  stored = "invalid";
  storageEvent("hyperchromeCollectionMode");
  expect(store!.getSnapshot()).toBe(true);
  stored = null;
  storageEvent(null);
  expect(store!.getSnapshot()).toBe(true);
  const updates = previewUpdates;
  storageEvent("unrelated");
  expect(previewUpdates).toBe(updates);
  unsubscribePreview();
  unsubscribeBreakdown();
  mode.setCountLowerLevels(false);
  expect(previewUpdates).toBe(updates);
});
