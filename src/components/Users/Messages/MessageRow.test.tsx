import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { cn } from "@/lib/utils";
import * as formatting from "@/utils/messages/formatting";
import * as parsing from "@/utils/messages/parsing";
import * as sorting from "@/utils/messages/sorting";
import * as invites from "@/utils/messages/invites";
import type { ComponentProps } from "react";
import type { MessageRow } from "./MessageRow";

type Node = {
  type: unknown;
  props: Record<string, unknown> & {
    className?: string;
    onClick?: (...args: unknown[]) => void;
    onPointerDown?: (...args: unknown[]) => void;
    onPointerMove?: (...args: unknown[]) => void;
    onPointerUp?: (...args: unknown[]) => void;
    onOpenChange?: (...args: unknown[]) => void;
  };
};
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function harness(mobile: boolean) {
  const refs: unknown[] = [];
  let cursor = 0;
  let timerId = 0;
  const timers = new Map<number, () => void>();
  const cleanups: (() => void)[] = [];
  const exports = {} as { MessageRow: typeof MessageRow };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const imports: Record<string, unknown> = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: {
      useRef: (initial: unknown) => {
        const index = cursor++;
        refs[index] ??= { current: initial };
        return refs[index];
      },
      useState: (initial: unknown) => {
        const index = cursor++;
        refs[index] ??= initial;
        return [
          refs[index],
          (value: unknown) => {
            refs[index] = value;
          },
        ];
      },
      useEffect: (effect: () => () => void) => cleanups.push(effect()),
    },
    "@/hooks/useMediaQuery": { useMediaQuery: () => mobile },
    "@/lib/utils": { cn },
    "@/utils/messages/formatting": formatting,
    "@/utils/messages/parsing": parsing,
    "@/utils/messages/sorting": sorting,
    "@/utils/messages/invites": invites,
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageRow.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) =>
        imports[name] ?? new Proxy({}, { get: (_, key) => String(key) }),
      setTimeout: (callback: () => void) => {
        timers.set(++timerId, callback);
        return timerId;
      },
      clearTimeout: (id: number) => timers.delete(id),
    },
  );
  const message = {
    id: "message",
    senderId: "me",
    receiverId: "them",
    content: "hello",
    createdAt: 1,
  };
  let active: string | null = null;
  const replies: unknown[] = [];
  const edits: unknown[] = [];
  const deletes: unknown[] = [];
  const props = {
    message,
    messages: [message],
    index: 0,
    currentUser: { id: "me" },
    currentUserMessageUser: { id: "me", username: "Me", avatar: "" },
    selectedUser: { id: "them", username: "Them", avatar: "" },
    activeMessageId: null,
    replyingToMessage: null,
    editingMessageId: null,
    deletingMessageId: null,
    setActiveMessageId: (id: string | null) => {
      active = id;
    },
    setReplyingToMessage: (value: unknown) => replies.push(value),
    setEditingMessageId: (value: unknown) => edits.push(value),
    handleDeleteMessage: (...args: unknown[]) => deletes.push(args),
  } as unknown as ComponentProps<typeof MessageRow>;
  return {
    props,
    replies,
    edits,
    deletes,
    active: () => active,
    render: () => {
      cursor = 0;
      props.activeMessageId = active;
      return nodes(exports.MessageRow(props));
    },
    flush: () => {
      for (const callback of timers.values()) callback();
      timers.clear();
    },
    unmount: () => cleanups.forEach((cleanup) => cleanup()),
  };
}

test("mobile holds reveal actions without opening the sheet; scrolling and unmount cancel it", () => {
  const h = harness(true);
  const tree = h.render();
  const row = tree.find((node) => "data-message-row" in node.props)!;
  const event = {
    pointerType: "touch",
    clientX: 20,
    clientY: 20,
    target: { closest: () => null },
  };
  row.props.onPointerDown!(event);
  row.props.onPointerMove!({ clientX: 20, clientY: 40 });
  h.flush();
  expect(h.active()).toBeNull();
  row.props.onPointerDown!(event);
  row.props.onPointerUp!();
  h.flush();
  expect(h.active()).toBeNull();
  row.props.onPointerDown!(event);
  h.flush();
  expect(h.active()).toBe("message");
  expect(h.render().find((node) => node.type === "Sheet")!.props.open).toBe(
    false,
  );
  h.render().find((node) => node.props["aria-label"] === "Message actions")!
    .props.onClick!();
  const sheet = h.render().find((node) => node.type === "Sheet")!;
  expect(sheet.props.open).toBe(true);
  const content = h.render().find((node) => node.type === "SheetContent")!;
  expect(content.props.overlayClassName).toBe("bg-black/20 backdrop-blur-none");
  expect(
    h
      .render()
      .some(
        (node) =>
          node.type === "ChatEvent" &&
          node.props.className?.split(" ").includes("bg-quaternary-bg"),
      ),
  ).toBe(true);
  let defaultPrevented = false;
  let panelFocused = false;
  (content.props.onOpenAutoFocus as (event: unknown) => void)({
    preventDefault: () => {
      defaultPrevented = true;
    },
    target: {
      focus: () => {
        panelFocused = true;
      },
    },
  });
  expect(defaultPrevented).toBe(true);
  expect(panelFocused).toBe(true);
  expect(content.props.tabIndex).toBe(-1);
  expect(String(content.props.className).split(" ")).toContain("outline-none");
  sheet.props.onOpenChange!(false);
  expect(h.active()).toBeNull();
  expect(
    h
      .render()
      .some(
        (node) =>
          node.type === "ChatEvent" &&
          node.props.className?.split(" ").includes("bg-quaternary-bg"),
      ),
  ).toBe(false);
  expect(
    tree.find((node) => node.type === "ChatEvent")!.props.onClick,
  ).toBeUndefined();
  row.props.onPointerDown!(event);
  h.unmount();
  h.flush();
  expect(h.active()).toBeNull();
});

test("tapping or holding sent and received text reveals only the action button and preserves selection", () => {
  for (const senderId of ["me", "them"]) {
    const h = harness(true);
    h.props.message.senderId = senderId;
    const tree = h.render();
    const row = tree.find((node) => "data-message-row" in node.props)!;
    const content = tree.find((node) => "data-message-content" in node.props)!;
    row.props.onPointerDown!({
      pointerType: "touch",
      clientX: 20,
      clientY: 20,
      target: {
        closest: () => null,
      },
    });
    h.flush();
    expect(h.active()).toBe("message");
    expect(row.props.onContextMenu).toBeUndefined();
    const action = h
      .render()
      .find((node) => node.props["aria-label"] === "Message actions")!;
    expect(action.props.className).not.toContain("sr-only");
    expect(h.render().find((node) => node.type === "Sheet")!.props.open).toBe(
      false,
    );
    h.props.setActiveMessageId(null);
    row.props.onClick!({ target: { closest: () => null } });
    expect(h.active()).toBe("message");
    expect(h.render().find((node) => node.type === "Sheet")!.props.open).toBe(
      false,
    );
    expect(content).toBeDefined();
    action.props.onClick!();
    expect(h.render().find((node) => node.type === "Sheet")!.props.open).toBe(
      true,
    );
  }
});

test("desktop toolbar uses existing reply and edit actions; sending disables actions without revealing the toolbar", () => {
  const h = harness(false);
  let tree = h.render();
  expect(
    tree.find((node) => node.props["aria-label"] === "Reply to message")!.props
      .title,
  ).toBeUndefined();
  expect(
    tree.find((node) => node.props["aria-label"] === "Edit message")!.props
      .title,
  ).toBeUndefined();
  expect(
    tree
      .filter((node) => node.type === "TooltipContent")
      .map((node) => node.props.children),
  ).toEqual(["Reply", "Edit", "More message actions"]);
  tree.find((node) => node.props["aria-label"] === "Reply to message")!.props
    .onClick!();
  tree.find((node) => node.props["aria-label"] === "Edit message")!.props
    .onClick!();
  expect(h.replies).toEqual([h.props.message]);
  expect(h.edits).toEqual(["message"]);
  h.props.isSending = true;
  tree = h.render();
  expect(
    tree.find((node) => node.props["aria-label"] === "Reply to message")!.props
      .disabled,
  ).toBe(true);
  const toolbar = tree.find((node) =>
    node.props.className?.includes("lg:group-hover/message:opacity-100"),
  )!;
  expect(toolbar.props.className!.split(" ")).toContain("opacity-0");
  expect(toolbar.props.className!.split(" ")).not.toContain(
    "disabled:opacity-50",
  );
  expect(tree.find((node) => node.type === "Sheet")!.props.open).toBe(false);
});

test("the reply target stays highlighted after the sheet closes until replying is canceled", () => {
  const h = harness(true);
  h.props.replyingToMessage = h.props.message;
  const highlighted = () =>
    h
      .render()
      .some(
        (node) =>
          node.type === "ChatEvent" &&
          node.props.className?.split(" ").includes("bg-quaternary-bg"),
      );
  expect(h.active()).toBeNull();
  expect(highlighted()).toBe(true);
  h.props.replyingToMessage = null;
  expect(highlighted()).toBe(false);
});

test("editing uses a persistent row background without the message hover background", () => {
  const h = harness(false);
  h.props.editingMessageId = h.props.message.id;
  h.props.emojiStringMap = {};
  const tree = h.render();
  const row = tree.find(
    (node) =>
      node.type === "ChatEvent" &&
      node.props.className?.includes("relative w-full"),
  )!;
  expect(row.props.className!.split(" ")).toContain("bg-tertiary-bg");
  expect(row.props.className).not.toContain("group-hover/message:bg");
  expect(
    tree.find((node) => node.type === "MessageEditor")?.props.message,
  ).toBe(h.props.message);
});

test("selecting Reply in the mobile sheet sets the reply target before dismissing it", () => {
  const h = harness(true);
  const row = h.render().find((node) => "data-message-row" in node.props)!;
  row.props.onPointerDown!({
    pointerType: "touch",
    clientX: 20,
    clientY: 20,
    target: { closest: () => null },
  });
  h.flush();
  h.render().find((node) => node.props["aria-label"] === "Message actions")!
    .props.onClick!();
  const tree = h.render();
  tree.find(
    (node) =>
      typeof node.type === "function" &&
      nodes(node.props.children).some(
        (child) => child.props.icon === "heroicons-outline:reply",
      ),
  )!.props.onClick!();
  tree.find(
    (node) =>
      node.type === "div" &&
      node.props.onClick &&
      !("data-message-row" in node.props),
  )!.props.onClick!();
  expect(h.replies).toEqual([h.props.message]);
  expect(h.active()).toBeNull();
});

test("pending messages and interactive targets cannot open mobile actions; delete retains confirmation", () => {
  const h = harness(true);
  const event = {
    pointerType: "touch",
    clientX: 20,
    clientY: 20,
    target: { closest: () => ({}) },
  };
  let tree = h.render();
  tree.find((node) => "data-message-row" in node.props)!.props.onPointerDown!(
    event,
  );
  tree.find((node) => "data-message-row" in node.props)!.props.onClick!(event);
  h.flush();
  expect(h.active()).toBeNull();
  tree.find(
    (node) =>
      typeof node.type === "function" &&
      nodes(node.props.children).some(
        (child) => child.props.icon === "heroicons-outline:trash",
      ),
  )!.props.onClick!({ shiftKey: true });
  expect(h.deletes).toEqual([["message", false]]);
  h.props.message.status = "pending";
  tree = h.render();
  const textEvent = { ...event, target: { closest: () => null } };
  tree.find((node) => "data-message-row" in node.props)!.props.onPointerDown!(
    textEvent,
  );
  tree.find((node) => "data-message-row" in node.props)!.props.onClick!(
    textEvent,
  );
  h.flush();
  expect(h.active()).toBeNull();
  expect(
    tree.some((node) => node.props["aria-label"] === "Reply to message"),
  ).toBe(false);
});

test("invites, gifts and accepted offers have no text-message actions on mobile or desktop", () => {
  const cards = [
    { type: "game_invite", place_id: "123" },
    { type: "vip_server_invite", server_id: 1 },
    { type: "gift_sent", level: 1 },
    { type: "offer_accepted", trade: 1, offer: 2 },
  ];
  for (const mobile of [true, false]) {
    for (const metadata of cards) {
      const h = harness(mobile);
      h.props.message.type = "system";
      h.props.message.metadata = metadata;
      const tree = h.render();
      const trigger = tree.find((node) => node.type === "ContextMenuTrigger");
      if (trigger) expect(trigger.props.disabled).toBe(true);
      expect(tree.some((node) => node.type === "ContextMenuContent")).toBe(
        false,
      );
      expect(
        tree.some(
          (node) =>
            node.props["aria-label"] === "Reply to message" ||
            node.props["aria-label"] === "Edit message",
        ),
      ).toBe(false);
      const row = tree.find((node) => "data-message-row" in node.props)!;
      row.props.onPointerDown?.({
        pointerType: "touch",
        clientX: 20,
        clientY: 20,
        target: { closest: () => null },
      });
      h.flush();
      expect(h.active()).toBeNull();
    }
  }
});
