import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { hexToHsv, hsvToHex } from "@/utils/ui/accentColor";

interface Node {
  type: string;
  props: {
    children?: unknown;
    value?: string | number;
    maxLength?: number;
    className?: string;
    "aria-label"?: string;
    "aria-hidden"?: boolean;
    onChange?: (event: { target: { value: string } }) => void;
    onPaste?: (event: {
      clipboardData: { getData: (format: string) => string };
      preventDefault: () => void;
    }) => void;
    onClick?: () => void;
  };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("hex input keeps a fixed prefix while clearing, typing, pasting and picking colors", () => {
  const states: unknown[] = [];
  let cursor = 0;
  const changes: string[] = [];
  const exports = {} as { ColorPicker: (props: unknown) => Node };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./color-picker.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: () => ({ current: null }),
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states))
                states[index] =
                  typeof initial === "function" ? initial() : initial;
              return [
                states[index],
                (next: unknown) => {
                  states[index] = next;
                },
              ];
            },
          };
        if (name === "@/utils/ui/accentColor") return { hexToHsv, hsvToHex };
        if (name === "@/components/ui/popover") return {};
        if (name === "@/components/ui/button") return { Button: "Button" };
        if (name === "@/components/ui/IconWrapper") return { Icon: "Icon" };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  let value = "#5865f2";
  const render = (compact = false, reset = false) => {
    cursor = 0;
    return nodes(
      exports.ColorPicker({
        value,
        onChange: (hex: string) => changes.push(hex),
        onReset: reset
          ? () => {
              value = "#5865f2";
            }
          : undefined,
        compact,
      }),
    );
  };
  const input = () =>
    render().find((node) => node.props["aria-label"] === "Hex color")!;
  expect(input().props.value).toBe("5865f2");
  expect(input().props.maxLength).toBe(6);
  expect(
    render().some(
      (node) =>
        node.type === "span" &&
        node.props["aria-hidden"] &&
        node.props.children === "#",
    ),
  ).toBe(true);
  input().props.onChange?.({ target: { value: "" } });
  expect(input().props.value).toBe("");
  input().props.onChange?.({ target: { value: "abc" } });
  expect(input().props.value).toBe("abc");
  expect(changes).toEqual([]);
  input().props.onChange?.({ target: { value: "abcdef" } });
  expect(changes.at(-1)).toBe("#abcdef");
  expect(input().props.value).toBe("abcdef");
  let prevented = false;
  input().props.onPaste?.({
    clipboardData: { getData: () => " #123456 " },
    preventDefault: () => {
      prevented = true;
    },
  });
  expect(prevented).toBe(true);
  expect(changes.at(-1)).toBe("#123456");
  expect(input().props.value).toBe("123456");
  render()
    .find((node) => node.props["aria-label"] === "Use #ed4245")!
    .props.onClick?.();
  expect(changes.at(-1)).toBe("#ed4245");
  expect(input().props.value).toBe("ed4245");
  const compact = render(true);
  expect(
    compact.some((node) => node.props["aria-label"]?.startsWith("Use #")),
  ).toBe(false);
  expect(
    compact.find(
      (node) => node.props["aria-label"] === "Saturation and brightness",
    )?.props.className,
  ).toContain("h-24");
  expect(compact.some((node) => node.props["aria-label"] === "Hue")).toBe(true);
  const compactHex = compact.find(
    (node) => node.props["aria-label"] === "Hex color",
  )!;
  compactHex.props.onChange?.({ target: { value: "123456" } });
  expect(changes.at(-1)).toBe("#123456");

  expect(render().some((node) => node.type === "Button")).toBe(false);
  value = "#123456";
  render();
  const reset = render(true, true).find((node) => node.type === "Button")!;
  expect(reset.props.children).toContain("Reset to original");
  reset.props.onClick?.();
  render();
  const restored = render();
  expect(
    restored.find((node) => node.props["aria-label"] === "Hex color")!.props
      .value,
  ).toBe("5865f2");
  expect(
    restored.find((node) => node.props["aria-label"] === "Hue")!.props.value,
  ).toBe(Math.round(hexToHsv("#5865f2").h));
  input().props.onChange?.({ target: { value: "abc" } });
  render(true, true)
    .find((node) => node.type === "Button")!
    .props.onClick?.();
  expect(input().props.value).toBe("5865f2");
});
