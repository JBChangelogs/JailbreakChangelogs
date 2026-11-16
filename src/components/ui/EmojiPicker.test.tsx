import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { EmojiPicker } from "./EmojiPicker";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("the full picker loads on demand, preserves the API quick row and emits complete single emoji", () => {
  const exports = {} as { EmojiPicker: typeof EmojiPicker };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  let lazyLoads = 0;
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./EmojiPicker.tsx", import.meta.url), "utf8"),
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
      require: (name: string) =>
        name === "react/jsx-runtime"
          ? { jsx, jsxs: jsx }
          : name === "react"
            ? {
                lazy: () => {
                  lazyLoads++;
                  return "FullPicker";
                },
                Suspense: "Suspense",
              }
            : { Spinner: "Spinner" },
    },
  );
  expect(lazyLoads).toBe(1);
  const selected: unknown[][] = [];
  const props = {
    quickEmojis: ["👍", "❤️", "👍"],
    twemojiEnabled: false,
    onSelect: (...args: unknown[]) => {
      selected.push(args);
    },
  };
  const tree = nodes(exports.EmojiPicker(props));
  const quickButtons = tree.filter((node) => node.type === "button");
  expect(quickButtons.map((node) => node.props.children)).toEqual(["👍", "❤️"]);
  (quickButtons[1].props.onClick as (event: { shiftKey: boolean }) => void)({
    shiftKey: true,
  });
  expect(selected).toEqual([["❤️", true]]);
  const full = tree.find((node) => node.type === "FullPicker")!;
  expect(full.props.twemojiEnabled).toBe(false);
  expect(full.props.onSelect).toBe(props.onSelect);
  expect(full.props.disabled).toBe(false);
  const disabled = nodes(
    exports.EmojiPicker({ ...props, disabled: true, twemojiEnabled: true }),
  );
  const disabledFull = disabled.find((node) => node.type === "FullPicker")!;
  expect(disabledFull.props.twemojiEnabled).toBe(true);
  expect(disabledFull.props.disabled).toBe(true);
  expect(selected).toHaveLength(1);
  expect(
    disabled
      .filter((node) => node.type === "button")
      .every((node) => node.props.disabled),
  ).toBe(true);
  expect(
    nodes(exports.EmojiPicker({ ...props, quickEmojis: [] })).some(
      (node) => node.type === "FullPicker",
    ),
  ).toBe(true);
});
