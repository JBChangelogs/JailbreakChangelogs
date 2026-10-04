import { expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { RobberyTrackerLastJoinedTarget } from "./useRobberyTrackerLastJoinedServer";

// Exercise the shared store in isolation without replacing React in other tests.
function createStore() {
  const browser = new EventTarget();
  const add = spyOn(browser, "addEventListener");
  const remove = spyOn(browser, "removeEventListener");
  let stored: string | null = null;
  let reads = 0;
  let capture: {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => RobberyTrackerLastJoinedTarget | null;
    getServerSnapshot: () => null;
  };
  const exports: {
    useRobberyTrackerLastJoinedServer?: (id?: string) => {
      setLastJoined: (value: RobberyTrackerLastJoinedTarget) => void;
      clearLastJoined: () => void;
    };
  } = {};
  const code = transpileModule(
    readFileSync(
      new URL("./useRobberyTrackerLastJoinedServer.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ModuleKind.CommonJS } },
  ).outputText;
  runInNewContext(code, {
    exports,
    window: browser,
    CustomEvent,
    require: (id: string) =>
      id === "react"
        ? {
            useCallback: (callback: unknown) => callback,
            useSyncExternalStore: (
              subscribe: typeof capture.subscribe,
              getSnapshot: typeof capture.getSnapshot,
              getServerSnapshot: typeof capture.getServerSnapshot,
            ) => {
              capture = { subscribe, getSnapshot, getServerSnapshot };
              return getSnapshot();
            },
          }
        : {
            safeSessionStorage: {
              getItem: () => {
                reads++;
                return stored;
              },
              setItem: (_key: string, value: string) => {
                stored = value;
              },
            },
          },
  });
  return {
    browser,
    add,
    remove,
    reads: () => reads,
    setStored: (value: string | null) => {
      stored = value;
    },
    mount: (id: string) => {
      const actions = exports.useRobberyTrackerLastJoinedServer!(id);
      return { ...capture!, ...actions };
    },
  };
}

test("cards share window listeners and only matching server snapshots change", () => {
  const store = createStore();
  const a = store.mount("server-a");
  const b = store.mount("server-b");
  const other = store.mount("server-c");
  const cleanup = [a, b, other].map((card) => card.subscribe(() => {}));
  expect(store.add).toHaveBeenCalledTimes(2);
  expect(store.reads()).toBe(2);

  a.setLastJoined({ kind: "grouped", jobId: "server-a", joinedAt: 100 });
  expect(a.getSnapshot()?.jobId).toBe("server-a");
  expect(b.getSnapshot()).toBeNull();
  expect(other.getSnapshot()).toBeNull();
  const initial = a.getSnapshot();
  expect(a.getSnapshot()).toBe(initial);
  expect(a.getServerSnapshot()).toBeNull();

  b.setLastJoined({ kind: "grouped", jobId: "server-b", joinedAt: 101 });
  expect(a.getSnapshot()).toBeNull();
  expect(b.getSnapshot()?.jobId).toBe("server-b");
  expect(other.getSnapshot()).toBeNull();
  b.clearLastJoined();
  expect(b.getSnapshot()).toBeNull();
  expect(store.reads()).toBe(2);

  cleanup[0]();
  cleanup[1]();
  expect(store.remove).not.toHaveBeenCalled();
  cleanup[2]();
  expect(store.remove).toHaveBeenCalledTimes(2);
});

test("storage updates, clears, invalid events, and remounts keep the store current", () => {
  const store = createStore();
  const card = store.mount("server-a");
  const unsubscribe = card.subscribe(() => {});
  store.setStored(
    JSON.stringify({ kind: "grouped", jobId: "server-a", joinedAt: 100 }),
  );
  store.browser.dispatchEvent(
    Object.assign(new Event("storage"), {
      key: "robberyTrackerLastJoinedTarget",
    }),
  );
  const initial = card.getSnapshot();
  expect(initial?.joinedAt).toBe(100);
  store.browser.dispatchEvent(
    new CustomEvent("robberyTracker:lastJoined", {
      detail: { jobId: "invalid" },
    }),
  );
  expect(card.getSnapshot()).toBe(initial);
  store.setStored(null);
  store.browser.dispatchEvent(
    Object.assign(new Event("storage"), { key: null }),
  );
  expect(card.getSnapshot()).toBeNull();
  unsubscribe();
  store.setStored(
    JSON.stringify({ kind: "grouped", jobId: "server-a", joinedAt: 102 }),
  );
  const remounted = store.mount("server-a");
  expect(remounted.getSnapshot()?.joinedAt).toBe(102);
  remounted.subscribe(() => {})();
});
