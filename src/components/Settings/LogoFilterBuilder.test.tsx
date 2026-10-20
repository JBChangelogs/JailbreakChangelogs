import { expect, test } from "bun:test";
import {
  Children,
  isValidElement,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import type LogoFilterBuilder from "./LogoFilterBuilder";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { hexToHsv } from "@/utils/ui/accentColor";

const source = transpileModule(
  readFileSync(new URL("./LogoFilterBuilder.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
).outputText;

function findWheel(
  node: ReactNode,
): ReactElement<HTMLAttributes<HTMLDivElement>> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ role?: string; children?: ReactNode }>(child))
      continue;
    if (child.props.role === "slider") return child;
    const found = findWheel(child.props.children);
    if (found) return found;
  }
}

function harness(value: string | null = null) {
  const changes: (string | null)[] = [];
  const matching: boolean[] = [];
  const previews: (string | null)[] = [];
  let localHue: number | null = null;
  let dragRef: { current: unknown } | undefined;
  const frames = new Map<number, () => void>();
  let nextFrame = 0;
  let cleanup = () => {};
  const exports = {} as { default: typeof LogoFilterBuilder };
  runInNewContext(source, {
    exports,
    requestAnimationFrame: (callback: () => void) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "react")
        return {
          useRef: (current: unknown) => (dragRef ??= { current }),
          useState: () => [
            localHue,
            (value: number | null) => {
              localHue = value;
            },
          ],
          useEffect: (effect: () => () => void) => {
            cleanup = effect();
          },
        };
      if (name === "next/image") return { default: "img" };
      return { cn, hexToHsv, Slider: "input" };
    },
  });
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback());
  };
  const render = () =>
    findWheel(
      exports.default({
        value,
        onChange: (filter) => changes.push(filter),
        onPreview: (filter) => previews.push(filter),
        background: "#222222",
        matchColor: "#2462cd",
        matching: true,
        onMatchingChange: (value) => matching.push(value),
      }),
    )!;
  let captured = false;
  const target = {
    focus() {},
    setPointerCapture() {
      captured = true;
    },
    releasePointerCapture() {
      captured = false;
    },
    hasPointerCapture() {
      return captured;
    },
    getBoundingClientRect: () => ({
      left: 20,
      top: 30,
      width: 160,
      height: 160,
    }),
  };
  const pointer = (clientX: number, clientY: number, button = 0) =>
    ({
      currentTarget: target,
      clientX,
      clientY,
      button,
      pointerId: 1,
    }) as unknown as PointerEvent<HTMLDivElement>;
  return {
    get wheel() {
      return render().props;
    },
    changes,
    previews,
    matching,
    pointer,
    flush,
    frames,
    cleanup,
  };
}

test("wheel maps pointer angles to saved hue and preserves other adjustments", () => {
  const h = harness("saturate(0.55) brightness(0.9)");
  h.wheel.onPointerMove!(h.pointer(180, 110));
  expect(h.changes).toEqual([]);
  h.wheel.onPointerDown!(h.pointer(180, 110, 2));
  expect(h.changes).toEqual([]);
  h.wheel.onPointerDown!(h.pointer(100, 30));
  h.flush();
  h.wheel.onPointerMove!(h.pointer(180, 110));
  h.flush();
  h.wheel.onPointerMove!(h.pointer(100, 190));
  h.flush();
  h.wheel.onPointerMove!(h.pointer(20, 110));
  h.flush();
  h.wheel.onPointerMove!(h.pointer(100, 110));
  expect(h.changes).toEqual([]);
  expect(h.previews).toEqual([
    "saturate(0.55) brightness(0.9)",
    "hue-rotate(90deg) saturate(0.55) brightness(0.9)",
    "hue-rotate(-180deg) saturate(0.55) brightness(0.9)",
    "hue-rotate(-90deg) saturate(0.55) brightness(0.9)",
  ]);
  expect(h.matching).toEqual([]);
  expect(h.wheel["aria-valuenow"]).toBe(-90);
  h.wheel.onPointerUp!(h.pointer(20, 110));
  expect(h.changes).toEqual([
    "hue-rotate(-90deg) saturate(0.55) brightness(0.9)",
  ]);
  expect(h.matching).toEqual([false]);
});

test("wheel supports keyboard steps, seam wrapping, and endpoint navigation", () => {
  const h = harness("hue-rotate(175deg)");
  let prevented = 0;
  for (const [key, shiftKey] of [
    ["ArrowRight", false],
    ["ArrowLeft", true],
    ["Home", false],
    ["End", false],
    ["Tab", false],
  ] as const) {
    h.wheel.onKeyDown!({
      key,
      shiftKey,
      preventDefault() {
        prevented++;
      },
    } as KeyboardEvent<HTMLDivElement>);
  }
  expect(h.wheel["aria-valuenow"]).toBe(175);
  expect(h.changes).toEqual([
    "hue-rotate(-180deg)",
    "hue-rotate(160deg)",
    "hue-rotate(-180deg)",
    "hue-rotate(180deg)",
  ]);
  expect(prevented).toBe(4);
});

test("fast dragging coalesces events and release commits the final position", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(100, 30));
  h.wheel.onPointerMove!(h.pointer(180, 110));
  h.wheel.onPointerMove!(h.pointer(20, 110));
  expect(h.changes).toEqual([]);
  expect(h.frames.size).toBe(1);
  h.flush();
  expect(h.changes).toEqual([]);
  expect(h.previews).toEqual(["hue-rotate(-90deg)"]);
  expect(h.wheel["aria-valuenow"]).toBe(-90);
  h.wheel.onPointerMove!(h.pointer(100, 190));
  h.wheel.onPointerUp!(h.pointer(180, 110));
  expect(h.changes.at(-1)).toBe("hue-rotate(90deg)");
  expect(h.frames.size).toBe(0);
  h.flush();
  expect(h.changes.length).toBe(1);
});

test("unmount cancels a queued drag update", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(180, 110));
  h.cleanup();
  h.flush();
  expect(h.changes).toEqual([]);
});

test("dragging uses one-degree precision and cancellation keeps the last color", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(180, 100));
  h.wheel.onPointerCancel!(h.pointer(180, 100));
  expect(h.changes).toEqual(["hue-rotate(83deg)"]);
  expect(h.frames.size).toBe(0);
});

test("losing capture after a rendered frame still commits the last preview", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(180, 110));
  h.flush();
  expect(h.changes).toEqual([]);
  h.wheel.onLostPointerCapture!(h.pointer(180, 110));
  expect(h.changes).toEqual(["hue-rotate(90deg)"]);
  h.wheel.onLostPointerCapture!(h.pointer(180, 110));
  expect(h.changes.length).toBe(1);
});
