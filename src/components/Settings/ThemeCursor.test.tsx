import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("theme icon follows the mouse, hides on exit and stops when disabled", () => {
  const style = { visibility: "visible", transform: "" };
  const documentEvents = new EventTarget();
  const windowEvents = new EventTarget();
  const mediaEvents = new EventTarget();
  const media = Object.assign(mediaEvents, { matches: true });
  let enabled = true;
  let effect: () => (() => void) | undefined = () => undefined;
  const exports = {} as { default: () => { props: Record<string, unknown> } };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ThemeCursor.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      HTMLIFrameElement: class {},
      document: documentEvents,
      window: Object.assign(windowEvents, { matchMedia: () => media }),
      require: (name: string) => {
        if (name === "react/jsx-runtime")
          return { jsx: (_type: unknown, props: unknown) => ({ props }) };
        if (name === "react")
          return {
            useRef: () => ({ current: { style } }),
            useSyncExternalStore: () => enabled,
            useEffect: (callback: typeof effect) => (effect = callback),
          };
        return {};
      },
    },
  );
  const move = (pointerType = "mouse") =>
    documentEvents.dispatchEvent(
      Object.assign(new Event("pointermove"), {
        pointerType,
        clientX: 100,
        clientY: 200,
      }),
    );
  const rendered = exports.default();
  expect(rendered.props["aria-hidden"]).toBe("true");
  expect(rendered.props.className).toContain("pointer-events-none");
  const cleanup = effect();
  expect(style.visibility).toBe("hidden");
  move();
  expect(style).toEqual({
    visibility: "visible",
    transform: "translate(116px, 218px)",
  });
  move("touch");
  expect(style.visibility).toBe("hidden");
  for (const [target, event] of [
    [documentEvents, "pointerout"],
    [documentEvents, "visibilitychange"],
    [windowEvents, "blur"],
    [mediaEvents, "change"],
  ] as const) {
    move();
    target.dispatchEvent(new Event(event));
    expect(style.visibility).toBe("hidden");
  }
  media.matches = false;
  move();
  expect(style.visibility).toBe("hidden");
  media.matches = true;
  cleanup?.();
  move();
  expect(style.visibility).toBe("hidden");
  enabled = false;
  exports.default();
  effect();
  move();
  expect(style.visibility).toBe("hidden");
});
