import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("banner previews measure the profile layout, follow resizes, and remove the probe", () => {
  let width = 1278;
  let height = 280;
  let ratio: number | null = null;
  let effect: (() => (() => void) | undefined) | undefined;
  let resize = () => {};
  let removed = false;
  let disconnected = false;
  const elements: Array<{
    className: string;
    append: (child: unknown) => void;
    setAttribute: () => void;
    getBoundingClientRect: () => { width: number; height: number };
    remove: () => void;
  }> = [];
  const main = {
    append: (element: unknown) => expect(element).toBe(elements[0]),
  };
  const exports = {} as {
    useProfileBannerAspectRatio: (enabled?: boolean) => number | null;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useProfileBannerAspectRatio.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: () => ({
        useState: () => [ratio, (next: number) => (ratio = next)],
        useLayoutEffect: (next: typeof effect) => (effect = next),
      }),
      document: {
        querySelector: () => main,
        createElement: () => {
          const element = {
            className: "",
            append: () => {},
            setAttribute: () => {},
            getBoundingClientRect: () => ({ width, height }),
            remove: () => {
              removed = true;
            },
          };
          elements.push(element);
          return element;
        },
      },
      ResizeObserver: class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(element: unknown) {
          expect(element).toBe(elements[3]);
        }
        disconnect() {
          disconnected = true;
        }
      },
    },
  );
  exports.useProfileBannerAspectRatio(false);
  expect(effect?.()).toBeUndefined();
  expect(elements).toHaveLength(0);
  exports.useProfileBannerAspectRatio();
  const cleanup = effect?.();
  expect(exports.useProfileBannerAspectRatio()).toBe(1278 / 280);
  width = 364;
  height = 160;
  resize();
  expect(exports.useProfileBannerAspectRatio()).toBe(364 / 160);
  width = 0;
  resize();
  expect(exports.useProfileBannerAspectRatio()).toBe(364 / 160);
  cleanup?.();
  expect(removed).toBe(true);
  expect(disconnected).toBe(true);
});
