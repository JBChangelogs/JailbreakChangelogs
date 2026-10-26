import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("background preview measures available space and removes its observer and frame", () => {
  let width = 1680;
  let height = 1020;
  let ratio: number | null = null;
  let effect: (() => (() => void) | undefined) | undefined;
  let resize = () => {};
  let removed = false;
  let disconnected = false;
  let appended = false;
  const frame = {
    className: "",
    setAttribute: () => {},
    getBoundingClientRect: () => ({ width, height }),
    remove: () => {
      removed = true;
    },
  };
  const exports = {} as {
    useProfileBackgroundAspectRatio: (enabled: boolean) => number | null;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useProfileBackgroundAspectRatio.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: () => ({
        useState: () => [
          ratio,
          (next: number) => {
            ratio = next;
          },
        ],
        useLayoutEffect: (next: typeof effect) => {
          effect = next;
        },
      }),
      document: {
        querySelector: () => ({
          append: () => {
            appended = true;
          },
        }),
        createElement: () => frame,
      },
      ResizeObserver: class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(element: unknown) {
          expect(element).toBe(frame);
        }
        disconnect() {
          disconnected = true;
        }
      },
    },
  );
  exports.useProfileBackgroundAspectRatio(false);
  expect(effect?.()).toBeUndefined();
  expect(appended).toBe(false);
  exports.useProfileBackgroundAspectRatio(true);
  const cleanup = effect?.();
  expect(exports.useProfileBackgroundAspectRatio(true)).toBe(1680 / 1020);
  width = 1848;
  height = 960;
  resize();
  expect(exports.useProfileBackgroundAspectRatio(true)).toBe(1848 / 960);
  height = 0;
  resize();
  expect(exports.useProfileBackgroundAspectRatio(true)).toBe(1848 / 960);
  cleanup?.();
  expect(disconnected).toBe(true);
  expect(removed).toBe(true);
});
