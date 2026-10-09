import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { useMessageNavigationScroll } from "./useMessageNavigationScroll";
import { getConversationIdFromPathname } from "./useMessageNavigationScroll";
import type { Message } from "@/utils/messages/types";
import { isUserMessage } from "@/utils/messages/invites";

test("conversation selection comes from the thread URL before effects run", () => {
  expect(getConversationIdFromPathname("/messages/123")).toBe("123");
  expect(getConversationIdFromPathname("/messages/%31%32%33")).toBe("123");
  expect(getConversationIdFromPathname("/messages")).toBeNull();
  expect(getConversationIdFromPathname("/messages-other/123")).toBeNull();
  expect(getConversationIdFromPathname("/messages/%ZZ")).toBeNull();
});

test("user embeds scroll on send, resizing stays pinned, and refreshes preserve reading and prepend positions", () => {
  type ScrollState = ReturnType<typeof useMessageNavigationScroll>;
  const slots: unknown[] = [];
  let cursor = 0;
  let layouts: (() => unknown)[] = [];
  let effects: (() => unknown)[] = [];
  let cleanups: (() => void)[] = [];
  const frames: (() => void)[] = [];
  const scrolls: string[] = [];
  let resize = () => {};
  let disconnected = 0;
  let top = 0;
  const child = {};
  const container = {
    scrollHeight: 1000,
    clientHeight: 300,
    children: [child],
    get scrollTop() {
      return top;
    },
    set scrollTop(value: number) {
      top = Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight));
    },
    scrollTo(options: { top: number; behavior: string }) {
      this.scrollTop = options.top;
      scrolls.push(options.behavior);
    },
    querySelector: () => null,
  };
  const exports = {} as {
    useMessageNavigationScroll: (options: unknown) => ScrollState;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useMessageNavigationScroll.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      requestAnimationFrame: (callback: () => void) => frames.push(callback),
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
        location: { pathname: "/messages/recipient" },
      },
      CustomEvent: class {},
      ResizeObserver: class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe(element: unknown) {
          expect(element === container || element === child).toBe(true);
        }
        disconnect() {
          disconnected++;
        }
      },
      require: (name: string) => {
        if (name === "@/utils/messages/parsing") return { asId: String };
        if (name === "@/utils/messages/invites") return { isUserMessage };
        return {
          useState: (initial: unknown) => {
            const index = cursor++;
            if (!(index in slots))
              slots[index] =
                typeof initial === "function" ? initial() : initial;
            return [
              slots[index],
              (value: unknown) => {
                slots[index] =
                  typeof value === "function" ? value(slots[index]) : value;
              },
            ];
          },
          useRef: (initial: unknown) => {
            const index = cursor++;
            if (!(index in slots)) slots[index] = { current: initial };
            return slots[index];
          },
          useCallback: (callback: unknown) => callback,
          useLayoutEffect: (effect: () => unknown) => layouts.push(effect),
          useEffect: (effect: () => unknown) => effects.push(effect),
        };
      },
    },
  );
  let messages: Message[] = [
    { id: "text", senderId: "me", receiverId: "recipient", content: "Hi" },
  ];
  const render = () => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
    cursor = 0;
    layouts = [];
    effects = [];
    const state = exports.useMessageNavigationScroll({
      pathname: "/messages/recipient",
      selectedUserId: "recipient",
      setSelectedUserId: () => {},
      messages,
      currentUserId: "me",
      isLoadingMessages: false,
    });
    state.messagesContainerRef.current = container as unknown as HTMLDivElement;
    for (const effect of [...layouts, ...effects]) {
      const cleanup = effect();
      if (typeof cleanup === "function") cleanups.push(cleanup as () => void);
    }
    while (frames.length) frames.shift()!();
    return state;
  };
  let state = render();
  expect(container.scrollTop).toBe(700);
  container.scrollHeight = 1150;
  resize();
  expect(container.scrollTop).toBe(850);
  container.scrollTop = 100;
  state.handleMessagesScroll();
  container.scrollHeight = 1200;
  resize();
  expect(container.scrollTop).toBe(100);
  state = render();
  resize();
  expect(container.scrollTop).toBe(100);
  for (const metadata of [
    { type: "gift_sent", level: 1 },
    { type: "vip_server_invite", server_id: 7 },
  ]) {
    state.pendingOwnSendScrollRef.current = true;
    messages = [
      ...messages,
      {
        id: `own-${metadata.type}`,
        senderId: "me",
        receiverId: "recipient",
        content: "Invite",
        type: "system",
        metadata,
      },
    ];
    container.scrollHeight += 150;
    scrolls.length = 0;
    state = render();
    expect(scrolls).toContain("smooth");
    expect(container.scrollTop).toBe(
      container.scrollHeight - container.clientHeight,
    );
    expect(state.pendingOwnSendScrollRef.current).toBe(false);
  }
  container.scrollTop = 100;
  state.handleMessagesScroll();
  messages = [
    ...messages,
    {
      id: "incoming-gift",
      senderId: "recipient",
      receiverId: "me",
      content: "Gift",
      type: "system",
      metadata: { type: "gift_sent", level: 2 },
    },
  ];
  container.scrollHeight += 150;
  state = render();
  expect(container.scrollTop).toBe(100);
  state = render();
  expect(state.hasNewMessagesBelow).toBe(true);
  expect(state.newMessagesStartId).toBe("incoming-gift");
  state.prependScrollRestoreRef.current = {
    conversationId: "recipient",
    prevScrollTop: 100,
    prevScrollHeight: container.scrollHeight,
  };
  messages = [
    { id: "older", senderId: "recipient", receiverId: "me", content: "Older" },
    ...messages,
  ];
  container.scrollHeight += 200;
  state = render();
  expect(container.scrollTop).toBe(300);
  resize();
  expect(container.scrollTop).toBe(300);
  expect(state.prependScrollRestoreRef.current).toBeNull();
  expect(disconnected).toBeGreaterThan(0);
  cleanups.forEach((cleanup) => cleanup());
});
