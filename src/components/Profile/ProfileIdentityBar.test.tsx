import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("identity bar appears only above the site header and cleans up its observer", () => {
  let visible = false;
  let effect: () => () => void;
  let observeEntry: (
    entries: { boundingClientRect: { bottom: number } }[],
  ) => void;
  let frame: () => void;
  let resize: (() => void) | undefined;
  let disconnects = 0;
  const heading = {};
  const exports = {} as {
    default: (props: unknown) => { props: { children: unknown } };
  };
  const jsx = (type: string, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ProfileIdentityBar.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      document: { documentElement: {} },
      getComputedStyle: () => ({ getPropertyValue: () => "64px" }),
      requestAnimationFrame: (callback: () => void) => {
        frame = callback;
        return 1;
      },
      cancelAnimationFrame: () => {},
      window: {
        addEventListener: (_name: string, callback: () => void) => {
          resize = callback;
        },
        removeEventListener: () => {
          resize = undefined;
        },
      },
      IntersectionObserver: class {
        constructor(
          callback: typeof observeEntry,
          options: { rootMargin: string },
        ) {
          observeEntry = callback;
          expect(options.rootMargin).toBe("-64px 0px 0px 0px");
        }
        observe(target: unknown) {
          expect(target).toBe(heading);
        }
        disconnect() {
          disconnects++;
        }
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: () => [
              visible,
              (value: boolean) => {
                visible = value;
              },
            ],
            useEffect: (callback: typeof effect) => {
              effect = callback;
            },
          };
        return {};
      },
    },
  );
  const props = {
    identityRef: { current: heading },
    user: { id: "123", username: "test", avatar: "" },
  };
  expect(exports.default(props).props.children).toBe(false);
  const cleanup = effect!();
  frame!();
  for (const [bottom, expected] of [
    [1000, false],
    [65, false],
    [64, true],
    [-100, true],
    [100, false],
  ] as const) {
    observeEntry!([{ boundingClientRect: { bottom } }]);
    expect(Boolean(exports.default(props).props.children)).toBe(expected);
  }
  resize!();
  frame!();
  expect(disconnects).toBe(1);
  cleanup();
  expect(disconnects).toBe(2);
  expect(resize).toBeUndefined();
});
