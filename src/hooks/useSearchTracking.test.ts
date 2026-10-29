import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("searches wait for results, debounce edits, cancel on cleanup and send no query text", () => {
  const events: unknown[] = [];
  let cleanup: (() => void) | undefined;
  const timers = new Map<number, () => void>();
  let nextId = 0;
  const exports = {} as typeof import("./useSearchTracking");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useSearchTracking.ts", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      setTimeout: (callback: () => void, ms: number) => {
        expect(ms).toBe(1000);
        timers.set(++nextId, callback);
        return nextId;
      },
      clearTimeout: (id: number) => timers.delete(id),
      require: (name: string) =>
        name === "react"
          ? {
              useEffect: (effect: () => (() => void) | undefined) => {
                cleanup?.();
                cleanup = effect();
              },
            }
          : {
              trackWebEvent: (name: string, props: unknown) =>
                events.push({ name, props }),
            },
    },
  );
  const track = exports.useSearchTracking;
  track("values", "", 10);
  track("values", "private", undefined);
  expect(timers.size).toBe(0);
  track("values", "private", 5);
  track("values", " private query ", undefined);
  expect(timers.size).toBe(0);
  track("values", " private query ", 0);
  for (const callback of timers.values()) callback();
  expect(events).toEqual([
    { name: "search", props: { surface: "values", query_len: 13, results: 0 } },
  ]);
  track("trade_picker", "private", 2);
  cleanup?.();
  expect(timers.size).toBe(0);
  expect(JSON.stringify(events)).not.toContain("private");
});
