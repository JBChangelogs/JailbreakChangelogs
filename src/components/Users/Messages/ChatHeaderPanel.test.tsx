import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { ComponentProps } from "react";
import type { ChatHeaderPanel } from "./ChatHeaderPanel";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("header block button requires confirmation, supports unblock and preserves profile links", () => {
  let open = false;
  let actions = 0;
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const exports = {} as { ChatHeaderPanel: typeof ChatHeaderPanel };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ChatHeaderPanel.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            useState: () => [
              open,
              (value: boolean) => {
                open = value;
              },
            ],
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "next/link") return { default: "Link" };
        if (name === "@/utils/messages/formatting")
          return {
            getDisplayName: (user: { username: string }) => user.username,
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const props: ComponentProps<typeof ChatHeaderPanel> = {
    selectedUser: { id: "them", username: "Recipient", avatar: "" },
    currentUserId: "me",
    isTargetOnline: false,
    shouldHidePresence: false,
    lastSeenTime: "",
    selectedUserBlockedByMe: false,
    isProcessingBlockAction: false,
    goToConversationList: () => {},
    onToggleBlock: () => {
      actions++;
    },
  };
  const render = () => nodes(exports.ChatHeaderPanel(props));
  const dialog = () => render().find((node) => node.type === "ConfirmDialog")!;
  const button = () =>
    render().find(
      (node) =>
        node.type === "Button" &&
        node.props["aria-label"] ===
          `${props.selectedUserBlockedByMe ? "Unblock" : "Block"} Recipient`,
    )!;
  expect(dialog().props.isOpen).toBe(false);
  (button().props.onClick as () => void)();
  expect(actions).toBe(0);
  expect(dialog().props.isOpen).toBe(true);
  expect(dialog().props.confirmVariant).toBe("destructive");
  (dialog().props.onClose as () => void)();
  expect(dialog().props.isOpen).toBe(false);
  expect(actions).toBe(0);
  (button().props.onClick as () => void)();
  (dialog().props.onConfirm as () => void)();
  expect(actions).toBe(1);
  expect(
    render()
      .filter((node) => node.type === "Link")
      .map((node) => node.props.href),
  ).toEqual(["/users/them", "/users/them"]);
  props.selectedUserBlockedByMe = true;
  expect(dialog().props.title).toBe("Unblock Recipient?");
  expect(button().props.disabled).toBe(false);
  props.isProcessingBlockAction = true;
  expect(button().props.disabled).toBe(true);
  expect(dialog().props.confirmDisabled).toBe(true);
  props.currentUserId = "them";
  expect(button()).toBeUndefined();
});
