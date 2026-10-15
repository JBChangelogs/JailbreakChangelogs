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

test("dragging down restores content panels without hiding actions and still collapses theme panels", () => {
  for (const initialSize of ["content", "half"] as const) {
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
      return exports.useBottomPanel("test panel", undefined, initialSize);
    };
    const panel = {
      style: { height: "" },
      getBoundingClientRect: () => ({
        height: panel.style.height
          ? Number.parseFloat(panel.style.height)
          : 200,
      }),
    };
    const handle = render().handle.props;
    handle.onPointerDown({
      clientY: 500,
      pointerId: 1,
      currentTarget: {
        closest: () => panel,
        setPointerCapture: () => {},
      },
    });
    handle.onPointerMove({ clientY: 800 });
    handle.onPointerUp({ clientY: 800 });
    const result = render();
    expect(result.collapsed).toBe(initialSize !== "content");
    expect(result.sheet.style).toBeUndefined();
    expect(result.sheet.className).toContain("h-auto");
  }
});
