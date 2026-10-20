import { expect, test } from "bun:test";
import {
  Children,
  isValidElement,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ButtonHTMLAttributes,
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
import { hexToHsv, hsvToHex } from "@/utils/ui/accentColor";

const source = transpileModule(
  readFileSync(new URL("./LogoFilterBuilder.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
).outputText;

function findElement<P>(
  node: ReactNode,
  match: (props: P) => boolean,
): ReactElement<P> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<P & { children?: ReactNode }>(child)) continue;
    if (match(child.props)) return child;
    const found = findElement(child.props.children, match);
    if (found) return found;
  }
}

function harness(value: string | null = null) {
  const changes: (string | null)[] = [];
  const matching: boolean[] = [];
  const previews: (string | null)[] = [];
  const states: boolean[] = [];
  let stateCursor = 0;
  let stateWrites = 0;
  let cursor = 0;
  let measurements = 0;
  const refs: { current: unknown }[] = [];
  const frames = new Map<number, () => void>();
  let nextFrame = 0;
  let cleanup = () => {};
  let mounted = false;
  const copied: string[] = [];
  const notices: string[] = [];
  let copyFails = false;
  const exports = {} as { default: typeof LogoFilterBuilder };
  runInNewContext(source, {
    exports,
    navigator: {
      clipboard: {
        writeText: async (value: string) => {
          if (copyFails) throw new Error("Clipboard denied");
          copied.push(value);
        },
      },
    },
    requestAnimationFrame: (callback: () => void) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "react")
        return {
          useId: () => "logo-wheel-instructions",
          useRef: (current: unknown) => (refs[cursor++] ??= { current }),
          useState: (initial: boolean) => {
            const index = stateCursor++;
            states[index] ??= initial;
            return [
              states[index],
              (value: boolean) => {
                stateWrites++;
                states[index] = value;
              },
            ];
          },
          useEffect: (effect: () => () => void) => {
            if (!mounted) {
              const result = effect();
              if (typeof result === "function") cleanup = result;
            }
          },
        };
      if (name === "next/image") return { default: "img" };
      if (name === "@/components/ui/input") return { Input: "input" };
      if (name === "@/components/ui/button") return { Button: "button" };
      if (name === "@/components/ui/tooltip")
        return {
          Tooltip: "tooltip",
          TooltipTrigger: "tooltip-trigger",
          TooltipContent: "tooltip-content",
        };
      if (name === "sonner")
        return {
          toast: {
            success: (message: string) => notices.push(message),
            error: (message: string) => notices.push(message),
          },
        };
      return { cn, hexToHsv, hsvToHex };
    },
  });
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback());
  };
  const render = () => {
    cursor = 0;
    stateCursor = 0;
    const tree = exports.default({
      value,
      onChange: (filter) => changes.push(filter),
      onPreview: (filter) => previews.push(filter),
      background: "#222222",
      matchColor: "#2462cd",
      matching: true,
      onMatchingChange: (value) => matching.push(value),
    });
    const attachRefs = (node: ReactNode) => {
      for (const child of Children.toArray(node)) {
        if (
          !isValidElement<{
            ref?: { current: unknown };
            children?: ReactNode;
            defaultValue?: string;
          }>(child)
        )
          continue;
        if (child.props.ref)
          child.props.ref.current ??= {
            style: {},
            textContent: "",
            value: child.props.defaultValue ?? "",
          };
        attachRefs(child.props.children);
      }
    };
    attachRefs(tree);
    mounted = true;
    return tree;
  };
  const attributes: Record<string, string> = {};
  let captured = false;
  const target = {
    setAttribute(key: string, value: string) {
      attributes[key] = value;
    },
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
    getBoundingClientRect: () => {
      measurements++;
      return { left: 20, top: 30, width: 160, height: 160 };
    },
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
      return findElement<HTMLAttributes<HTMLDivElement>>(
        render(),
        (props) => props.role === "slider",
      )!.props;
    },
    attributes,
    get stateWrites() {
      return stateWrites;
    },
    get measurements() {
      return measurements;
    },
    get handle() {
      return refs[0].current as { style: { transform: string } };
    },
    get preview() {
      return refs[1].current as { style: { filter: string } };
    },
    get colorText() {
      return refs[2].current as { value: string };
    },
    get input() {
      return findElement<InputHTMLAttributes<HTMLInputElement>>(
        render(),
        (props) => props["aria-label"] === "Selected color hex",
      )!.props;
    },
    get copy() {
      return findElement<ButtonHTMLAttributes<HTMLButtonElement>>(
        render(),
        (props) => props["aria-label"] === "Copy selected color",
      )!.props;
    },
    get reset() {
      return findElement<ButtonHTMLAttributes<HTMLButtonElement>>(
        render(),
        (props) => props.children === "Reset to original",
      )!.props;
    },
    set copyFails(value: boolean) {
      copyFails = value;
    },
    copied,
    notices,
    changes,
    previews,
    matching,
    pointer,
    flush,
    frames,
    cleanup: () => cleanup(),
  };
}

test("wheel maps pointer angles to hue and radius to vividness while preserving brightness", () => {
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
    "saturate(2) brightness(0.9)",
    "hue-rotate(90deg) saturate(2) brightness(0.9)",
    "hue-rotate(-180deg) saturate(2) brightness(0.9)",
    "hue-rotate(-90deg) saturate(2) brightness(0.9)",
  ]);
  expect(h.matching).toEqual([]);
  expect(h.attributes["aria-valuenow"]).toBe("-90");
  h.wheel.onPointerUp!(h.pointer(20, 110));
  expect(h.changes).toEqual(["hue-rotate(-90deg) saturate(2) brightness(0.9)"]);
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
  expect(h.previews).toEqual(["hue-rotate(-90deg) saturate(2)"]);
  expect(h.attributes["aria-valuenow"]).toBe("-90");
  h.wheel.onPointerMove!(h.pointer(100, 190));
  h.wheel.onPointerUp!(h.pointer(180, 110));
  expect(h.changes.at(-1)).toBe("hue-rotate(90deg) saturate(2)");
  expect(h.frames.size).toBe(0);
  h.flush();
  expect(h.changes.length).toBe(1);
});

test("unmount cancels a queued drag update", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(180, 110));
  h.cleanup();
  expect(h.frames.size).toBe(0);
  h.flush();
  expect(h.changes).toEqual([]);
  expect(h.previews).toEqual([]);
});

test("dragging preserves fractional angles and cancellation keeps the last color", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(180, 100));
  h.wheel.onPointerCancel!(h.pointer(180, 100));
  expect(h.changes).toEqual(["hue-rotate(82.87deg) saturate(2)"]);
  expect(h.frames.size).toBe(0);
});

test("losing capture after a rendered frame still commits the last preview", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(180, 110));
  h.flush();
  expect(h.changes).toEqual([]);
  h.wheel.onLostPointerCapture!(h.pointer(180, 110));
  expect(h.changes).toEqual(["hue-rotate(90deg) saturate(2)"]);
  h.wheel.onLostPointerCapture!(h.pointer(180, 110));
  expect(h.changes.length).toBe(1);
});

test("pointer feedback moves by transform without React updates or repeated layout reads", () => {
  const h = harness();
  h.wheel.onPointerDown!(h.pointer(100, 30));
  const writes = h.stateWrites;
  h.wheel.onPointerMove!(h.pointer(180, 100));
  const position = h.handle.style.transform.match(
    /translate3d\((.*)cqw, (.*)cqw, 0\)/,
  )!;
  expect(Number(position[1])).toBeCloseTo((80 / Math.hypot(80, 10)) * 50, 8);
  expect(Number(position[2])).toBeCloseTo((-10 / Math.hypot(80, 10)) * 50, 8);
  expect(h.previews).toEqual([]);
  h.flush();
  expect(h.stateWrites).toBe(writes);
  expect(h.measurements).toBe(1);
  expect(h.preview.style.filter).toBe("hue-rotate(82.87deg) saturate(2)");
  expect(h.attributes["aria-valuenow"]).toBe("82.87");
  h.wheel.onPointerUp!(h.pointer(180, 100));
  expect(h.changes).toEqual(["hue-rotate(82.87deg) saturate(2)"]);
});

test("center keeps hue at zero vividness, half radius is 100%, and the edge clamps at 200%", () => {
  const h = harness("hue-rotate(45deg)");
  h.wheel.onPointerDown!(h.pointer(100, 110));
  h.flush();
  expect(h.previews.at(-1)).toBe("hue-rotate(45deg) saturate(0)");
  expect(h.attributes["aria-valuetext"]).toBe("#FFFFFF, vividness 0%");
  h.wheel.onPointerMove!(h.pointer(140, 110));
  h.flush();
  expect(h.previews.at(-1)).toBe("hue-rotate(90deg)");
  expect(h.colorText.value).toBe("FF80F4");
  expect(h.attributes["aria-valuetext"]).toBe("#FF80F4, vividness 100%");
  h.wheel.onPointerMove!(h.pointer(180, 110));
  h.flush();
  expect(h.previews.at(-1)).toBe("hue-rotate(90deg) saturate(2)");
  h.wheel.onPointerUp!(h.pointer(300, 110));
  expect(h.changes).toEqual(["hue-rotate(90deg) saturate(2)"]);
  expect(h.attributes["aria-valuetext"]).toBe("#FF00EA, vividness 200%");
});

test("keyboard controls vividness with normal and larger steps and respects its limits", () => {
  for (const [initial, key, shiftKey, expected] of [
    [null, "ArrowUp", false, "saturate(1.05)"],
    [null, "ArrowDown", true, "saturate(0.85)"],
    ["saturate(2)", "ArrowUp", false, "saturate(2)"],
    ["saturate(0)", "ArrowDown", false, "saturate(0)"],
  ] as const) {
    const h = harness(initial);
    h.wheel.onKeyDown!({
      key,
      shiftKey,
      preventDefault() {},
    } as KeyboardEvent<HTMLDivElement>);
    expect(h.changes).toEqual([expected]);
  }
});

test("saved colors display hex before dragging", () => {
  const h = harness();
  expect(h.wheel["aria-valuetext"]).toBe("#80B5FF, vividness 100%");
});

test("hex editing validates input and applies hue, vividness, and brightness", () => {
  for (const hex of ["#1ABC9C", "112233", "#FFFFFF", "#111111", "#000000"]) {
    const h = harness();
    const input = h.input;
    h.colorText.value = hex;
    input.onBlur!({
      currentTarget: h.colorText,
    } as unknown as React.FocusEvent<HTMLInputElement>);
    expect(h.changes.length).toBe(1);
    const selected = harness(h.changes[0]);
    expect(selected.wheel["aria-valuetext"]).toStartWith(
      `#${hex.replace(/^#/, "")},`.toUpperCase(),
    );
  }
  const h = harness();
  const input = h.input;
  h.colorText.value = "#12zz34";
  input.onBlur!({
    currentTarget: h.colorText,
  } as unknown as React.FocusEvent<HTMLInputElement>);
  expect(h.changes).toEqual([]);
  expect(h.input["aria-invalid"]).toBe(true);
  expect(h.input["aria-describedby"]).toBe("logo-wheel-instructions-hex-error");
  h.colorText.value = "12ab";
  input.onChange!({
    currentTarget: h.colorText,
  } as unknown as React.ChangeEvent<HTMLInputElement>);
  expect(h.input["aria-invalid"]).toBe(false);
});

test("Enter applies hex, Escape discards incomplete input, and reset restores the original", () => {
  const h = harness("hue-rotate(45deg) saturate(0.55) brightness(0.9)");
  const input = h.input;
  h.colorText.value = "#ff0000";
  input.onKeyDown!({
    key: "Enter",
    currentTarget: h.colorText,
    preventDefault() {},
  } as unknown as KeyboardEvent<HTMLInputElement>);
  expect(h.changes).toEqual(["hue-rotate(145deg) saturate(2)"]);
  h.colorText.value = "#12";
  input.onKeyDown!({
    key: "Escape",
    currentTarget: h.colorText,
    preventDefault() {},
    stopPropagation() {},
  } as unknown as KeyboardEvent<HTMLInputElement>);
  expect(h.colorText.value).toMatch(/^[0-9A-F]{6}$/);
  expect(h.changes.length).toBe(1);
  h.reset.onClick!({} as React.MouseEvent<HTMLButtonElement>);
  expect(h.changes.at(-1)).toBeNull();
  expect(h.matching.at(-1)).toBe(false);
});

test("swatch copies the selected color and handles a denied clipboard", async () => {
  const h = harness();
  expect(h.copy.type).toBe("button");
  expect(h.copy.style?.backgroundColor).toBe("#80B5FF");
  await h.copy.onClick!({} as React.MouseEvent<HTMLButtonElement>);
  expect(h.copied).toEqual(["#80B5FF"]);
  expect(h.notices).toEqual(["Color copied"]);
  h.copyFails = true;
  await h.copy.onClick!({} as React.MouseEvent<HTMLButtonElement>);
  expect(h.notices.at(-1)).toBe("Couldn't copy the color");
});

test("valid hex edits apply while typing without rewriting focused text", () => {
  const h = harness();
  const input = h.input;
  input.onFocus!({
    currentTarget: h.colorText,
  } as unknown as React.FocusEvent<HTMLInputElement>);
  for (const text of ["", "1", "12", "12a", "12ab", "12ab3"]) {
    h.colorText.value = text;
    input.onChange!({
      currentTarget: h.colorText,
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    expect(h.changes).toEqual([]);
    expect(h.colorText.value).toBe(text);
  }
  h.colorText.value = "12ab34";
  input.onChange!({
    currentTarget: h.colorText,
  } as unknown as React.ChangeEvent<HTMLInputElement>);
  expect(h.changes.length).toBe(1);
  expect(h.colorText.value).toBe("12ab34");
  h.colorText.value = "12ab35";
  input.onChange!({
    currentTarget: h.colorText,
  } as unknown as React.ChangeEvent<HTMLInputElement>);
  expect(h.changes.length).toBe(2);
  expect(h.colorText.value).toBe("12ab35");
});

test("hex input edits six digits and accepts a pasted hash prefix", () => {
  const h = harness();
  const input = h.input;
  expect(input.defaultValue).toBe("80B5FF");
  expect(input.maxLength).toBe(6);
  input.onFocus!({
    currentTarget: h.colorText,
  } as unknown as React.FocusEvent<HTMLInputElement>);
  let prevented = false;
  input.onPaste!({
    currentTarget: h.colorText,
    clipboardData: { getData: () => "#12ab34" },
    preventDefault() {
      prevented = true;
    },
  } as unknown as React.ClipboardEvent<HTMLInputElement>);
  expect(prevented).toBe(true);
  expect(h.colorText.value).toBe("12ab34");
  expect(h.changes.length).toBe(1);
});

test("invalid characters show an error while typing but incomplete hex digits stay quiet", () => {
  const h = harness();
  const input = h.input;
  h.colorText.value = "12RGG5";
  input.onChange!({
    currentTarget: h.colorText,
  } as unknown as React.ChangeEvent<HTMLInputElement>);
  expect(h.input["aria-invalid"]).toBe(true);
  expect(h.changes).toEqual([]);
  h.colorText.value = "12AB";
  input.onChange!({
    currentTarget: h.colorText,
  } as unknown as React.ChangeEvent<HTMLInputElement>);
  expect(h.input["aria-invalid"]).toBe(false);
  expect(h.changes).toEqual([]);
  h.colorText.value = "12AB34";
  input.onChange!({
    currentTarget: h.colorText,
  } as unknown as React.ChangeEvent<HTMLInputElement>);
  expect(h.input["aria-invalid"]).toBe(false);
  expect(h.changes.length).toBe(1);
});
