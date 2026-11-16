import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import twemoji from "@twemoji/api";
import type EmojiPickerContent from "./EmojiPickerContent";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("Frimousse uses the site theme, keeps complete emoji and Shift selection, and respects disabled and Twemoji preferences", () => {
  let imageFailed = false;
  const exports = {} as { default: typeof EmojiPickerContent };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./EmojiPickerContent.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: (value: unknown) => ({ current: value }),
            useCallback: (fn: unknown) => fn,
            useState: () => [
              imageFailed,
              (value: boolean) => {
                imageFailed = value;
              },
            ],
          };
        if (name === "frimousse")
          return {
            EmojiPicker: {
              Root: "Root",
              Search: "Search",
              Viewport: "Viewport",
              SkinToneSelector: "SkinToneSelector",
              List: "List",
              Loading: "Loading",
              Empty: "Empty",
            },
          };
        if (name === "@twemoji/api") return { default: twemoji };
        return { Spinner: "Spinner" };
      },
    },
  );
  const selected: unknown[][] = [];
  const props = {
    twemojiEnabled: true,
    onSelect: (...args: unknown[]) => {
      selected.push(args);
    },
  };
  const tree = nodes(exports.default(props));
  const root = tree[0];
  expect(root.type).toBe("Root");
  expect(root.props.className).toContain("bg-primary-bg");
  expect(
    tree.find((node) => node.type === "Search")?.props.className,
  ).toContain("bg-tertiary-bg");
  expect(tree.find((node) => node.type === "Search")?.props.autoFocus).toBe(
    true,
  );
  expect(tree.some((node) => node.type === "SkinToneSelector")).toBe(true);
  (root.props.onClickCapture as (event: { shiftKey: boolean }) => void)({
    shiftKey: true,
  });
  const select = root.props.onEmojiSelect as (emoji: { emoji: string }) => void;
  select({ emoji: "👩🏽‍💻" });
  expect(selected).toEqual([["👩🏽‍💻", true]]);
  (root.props.onKeyDownCapture as (event: { shiftKey: boolean }) => void)({
    shiftKey: false,
  });
  select({ emoji: "🇺🇸" });
  expect(selected[1]).toEqual(["🇺🇸", false]);
  const renderEmoji = (
    tree.find((node) => node.type === "List")?.props.components as {
      Emoji: (props: unknown) => Node;
    }
  ).Emoji;
  const glyph = renderEmoji({ emoji: { emoji: "👩🏽‍💻" } }).props.children as Node;
  const renderGlyph = (props = glyph.props) =>
    (glyph.type as (props: unknown) => Node)(props);
  const slot = renderGlyph();
  expect(slot.type).toBe("span");
  expect(slot.props.className).toContain("size-6");
  const image = slot.props.children as Node;
  expect(image.type).toBe("img");
  expect(image.props.width).toBe(24);
  expect(image.props.height).toBe(24);
  expect(image.props.src).toEndWith("/1f469-1f3fd-200d-1f4bb.png");
  expect(image.props.className).not.toContain("twemoji");
  for (const [emoji, file] of [
    ["❤️", "2764"],
    ["1️⃣", "31-20e3"],
    ["🏳️‍🌈", "1f3f3-fe0f-200d-1f308"],
    ["🇺🇸", "1f1fa-1f1f8"],
  ]) {
    const variant = renderGlyph({ emoji }).props.children as Node;
    expect(variant.props.src).toEndWith(`/${file}.png`);
  }
  (image.props.onError as () => void)();
  expect(renderGlyph().props.children).toBe("👩🏽‍💻");
  const native = nodes(
    exports.default({ ...props, twemojiEnabled: false, disabled: true }),
  );
  (native[0].props.onEmojiSelect as typeof select)({ emoji: "😂" });
  expect(selected).toHaveLength(2);
  expect(native.find((node) => node.type === "Search")?.props.disabled).toBe(
    true,
  );
  const nativeEmoji = (
    native.find((node) => node.type === "List")?.props.components as {
      Emoji: (props: unknown) => Node;
    }
  ).Emoji({ emoji: { emoji: "😂" } });
  expect(nativeEmoji.props.children).toBe("😂");
  expect(nativeEmoji.props.disabled).toBe(true);
});
