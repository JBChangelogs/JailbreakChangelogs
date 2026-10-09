import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { ComponentProps } from "react";
import type { MessageEditor } from "./MessageEditor";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function trigger(node: Node, event: string, value?: unknown) {
  (node.props[event] as (value?: unknown) => void)(value);
}

test("edit typing stays local, saving submits the latest draft, and emoji insertion and cancel controls still work", () => {
  const slots: unknown[] = [];
  let cursor = 0;
  const frames: (() => void)[] = [];
  const layouts: (() => void)[] = [];
  const saves: unknown[][] = [];
  let cancellations = 0;
  let focused = false;
  let selection: number[] = [];
  const exports = {} as { MessageEditor: typeof MessageEditor };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageEditor.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      requestAnimationFrame: (callback: () => void) => frames.push(callback),
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (value: unknown) => {
                  slots[index] = value;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = { current: initial };
              return slots[index];
            },
            useCallback: (callback: unknown) => callback,
            useLayoutEffect: (callback: () => void) => {
              if (layouts.length === 0) layouts.push(callback);
            },
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const props: ComponentProps<typeof MessageEditor> = {
    message: {
      id: "message",
      senderId: "me",
      receiverId: "them",
      content: "hello",
    },
    emojiStringMap: { smile: "🙂" },
    twemojiEnabled: false,
    isSending: false,
    onSave: (...args) => {
      saves.push(args);
    },
    onCancel: () => {
      cancellations++;
    },
  };
  const render = () => {
    cursor = 0;
    return nodes(exports.MessageEditor(props));
  };
  const input = () => render().find((node) => node.type === "CommentTextarea")!;
  expect(input().props.value).toBe("hello");
  (input().props.ref as { current: unknown }).current = {
    value: "hello",
    focus: () => {
      focused = true;
    },
    setSelectionRange: (...args: number[]) => {
      selection = args;
    },
  };
  layouts.forEach((layout) => layout());
  expect(focused).toBe(true);
  expect(selection).toEqual([5, 5]);
  for (const text of ["f", "fa", "fast", "fast typing"])
    trigger(input(), "onChange", text);
  expect(input().props.value).toBe("fast typing");
  expect(saves).toEqual([]);
  expect(cancellations).toBe(0);
  trigger(input(), "onKeyDown", {
    key: "Enter",
    shiftKey: false,
    preventDefault: () => {},
  });
  expect(saves).toEqual([["message", "fast typing"]]);
  trigger(input(), "onKeyDown", { key: "Enter", shiftKey: true });
  expect(saves).toHaveLength(1);
  expect(input().props.value).toBe("fast typing");

  (input().props.ref as { current: unknown }).current = {
    selectionStart: 1,
    focus: () => {
      focused = true;
    },
    setSelectionRange: (...args: number[]) => {
      selection = args;
    },
  };
  const tree = render();
  trigger(
    tree.find(
      (node) => node.props["aria-label"] === "Add an emoji to edited message",
    )!,
    "onPointerDown",
  );
  trigger(
    tree.find(
      (node) =>
        node.type === "button" &&
        nodes(node.props.children).some(
          (child) => child.props.children === "🙂",
        ),
    )!,
    "onClick",
    { shiftKey: false },
  );
  frames.forEach((frame) => frame());
  expect(input().props.value).toBe("f🙂ast typing");
  expect(focused).toBe(true);
  expect(selection).toEqual([3, 3]);
  trigger(input(), "onKeyDown", { key: "Escape" });
  expect(cancellations).toBe(1);
  const field = tree.find(
    (node) =>
      node.type === "div" &&
      String(node.props.className).includes("bg-secondary-bg"),
  )!;
  expect(
    nodes(field.props.children).some(
      (node) => node.props["aria-label"] === "Add an emoji to edited message",
    ),
  ).toBe(true);
  expect(
    nodes(field.props.children).some((node) =>
      String(node.props.className).includes("text-xs lg:flex"),
    ),
  ).toBe(false);
  expect(
    tree.some((node) =>
      String(node.props.className).includes("text-xs lg:flex"),
    ),
  ).toBe(true);
  props.isSending = true;
  expect(input().props.disabled).toBe(true);
});
