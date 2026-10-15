import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { BottomPanelHeader, type useBottomPanel } from "./bottom-panel";
import { cn } from "@/lib/utils";

test("bottom panel headers can hide the close button while keeping the handle and content", () => {
  const render = (showCloseButton?: boolean) =>
    renderToStaticMarkup(
      <BottomPanelHeader
        handle={<button>Resize panel</button>}
        showCloseButton={showCloseButton}
        closeLabel="Close the editor"
        onClose={() => {}}
      >
        <span>Panel title</span>
      </BottomPanelHeader>,
    );

  expect(render()).toContain('aria-label="Close the editor"');
  const messages = render(false);
  expect(messages).not.toContain('aria-label="Close the editor"');
  expect(messages).toContain("Resize panel");
  expect(messages).toContain("Panel title");
});

function harness(initialSize: "content" | "half", onDismiss?: () => void) {
  const state: unknown[] = [];
  let cursor = 0;
  const exports = {} as { useBottomPanel: typeof useBottomPanel };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./bottom-panel.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    {
      exports,
      window: { innerHeight: 1000 },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/lib/utils") return { cn };
        if (name === "@/hooks/useMediaQuery")
          return { useMediaQuery: () => true };
        if (name === "react")
          return {
            useRef: (current: unknown) => {
              const index = cursor++;
              state[index] ??= { current };
              return state[index];
            },
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in state)) state[index] = initial;
              return [
                state[index],
                (value: unknown) => {
                  state[index] = value;
                },
              ];
            },
          };
        return {};
      },
    },
  );
  const render = () => {
    cursor = 0;
    return exports.useBottomPanel(
      "test panel",
      undefined,
      initialSize,
      onDismiss,
    );
  };
  const panel = {
    style: { height: "" },
    getBoundingClientRect: () => ({
      height: panel.style.height ? Number.parseFloat(panel.style.height) : 300,
    }),
  };
  const start = () => {
    const handle = render().handle.props;
    handle.onPointerDown({
      clientY: 500,
      pointerId: 1,
      currentTarget: {
        closest: () => panel,
        setPointerCapture: () => {},
      },
    });
    return handle;
  };
  return { render, start, panel };
}

test("free resizing keeps panel contents visible and only a deliberate bar snap collapses themes", () => {
  for (const initialSize of ["content", "half"] as const) {
    for (const finalHeight of [72, 100, 150, 200, 400]) {
      const h = harness(initialSize);
      const handle = h.start();
      const clientY = 500 + 300 - finalHeight;
      handle.onPointerMove({ clientY });
      handle.onPointerUp({ clientY });
      const result = h.render();
      expect(result.collapsed).toBe(
        finalHeight < 100 && initialSize !== "content",
      );
      if (finalHeight >= 100) {
        expect(result.sheet.style).toEqual({ height: finalHeight });
      } else {
        expect(result.sheet.style).toBeUndefined();
        expect(result.sheet.className).toContain("h-auto");
      }
    }
  }
});

test("dismissible menus slide without resizing, restore short drags, and close on a downward swipe", () => {
  let dismissed = 0;
  const h = harness("content", () => {
    dismissed++;
  });
  let handle = h.start();
  handle.onPointerMove({ clientY: 450 });
  expect(h.render().sheet.style).toEqual({ transform: "translateY(0px)" });
  handle.onPointerMove({ clientY: 560 });
  expect(h.render().sheet.style).toEqual({ transform: "translateY(60px)" });
  expect(h.render().collapsed).toBe(false);
  expect(h.panel.style.height).toBe("");
  handle.onPointerUp({ clientY: 560 });
  expect(dismissed).toBe(0);
  expect(h.render().sheet.style).toEqual({ transform: "translateY(0px)" });
  handle = h.start();
  handle.onPointerMove({ clientY: 700 });
  handle.onPointerUp({ clientY: 700 });
  expect(dismissed).toBe(1);
  expect(h.render().sheet.style).toEqual({ transform: "translateY(0px)" });
  handle = h.start();
  handle.onPointerCancel({ type: "pointercancel", clientY: 800 });
  expect(dismissed).toBe(1);
  h.render().handle.props.onKeyDown({ key: "Enter", preventDefault() {} });
  expect(dismissed).toBe(2);
});
