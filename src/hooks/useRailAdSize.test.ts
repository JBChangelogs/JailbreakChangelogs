import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("rail sizes preserve the page container across navigation modes and gutter changes", () => {
  let width = 1920 - 240;
  let size = "none";
  let resize = () => {};
  let effect: (() => () => void) | undefined;
  let disconnected = false;
  const main = { getBoundingClientRect: () => ({ width }) };
  const exports = {} as { useRailAdSize: () => string };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useRailAdSize.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: () => ({
        useState: () => [size, (next: string) => (size = next)],
        useLayoutEffect: (next: typeof effect) => (effect = next),
      }),
      document: { querySelector: () => main },
      ResizeObserver: class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(element: unknown, options: unknown) {
          expect(element).toBe(main);
          expect(options).toEqual({ box: "border-box" });
        }
        disconnect() {
          disconnected = true;
        }
      },
    },
  );
  expect(exports.useRailAdSize()).toBe("none");
  const cleanup = effect?.();

  for (const sidebar of [0, 72, 240]) {
    for (const [available, expected] of [
      [1895, "none"],
      [1896, "small"],
      [2215, "small"],
      [2216, "wide"],
    ] as const) {
      const viewport = available + sidebar;
      width = viewport - sidebar;
      resize();
      expect(exports.useRailAdSize()).toBe(expected);
      if (expected !== "none") {
        const gutter = expected === "small" ? 180 : 340;
        expect(width - gutter * 2).toBeGreaterThanOrEqual(1536);
        resize();
        expect(exports.useRailAdSize()).toBe(expected);
      }
    }
  }
  cleanup?.();
  expect(disconnected).toBe(true);
});
