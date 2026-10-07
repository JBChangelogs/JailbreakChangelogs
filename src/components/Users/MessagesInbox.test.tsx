import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { ConversationListData } from "@/hooks/useConversationList";
import type { MessageThreadPage } from "@/hooks/useMessageThread";
import type { ConversationSummary, Message } from "@/utils/messages/types";

test("inbox cache setters preserve pagination, realtime changes and sibling conversations", () => {
  const client = new QueryClient();
  const threadKey = ["message-thread", "me", "them"];
  const siblingKey = ["message-thread", "me", "sibling"];
  const conversationKey = ["conversation-list", "me"];
  const message = (id: string, content = id, createdAt = 1): Message => ({
    id,
    senderId: "them",
    receiverId: "me",
    content,
    createdAt,
  });
  const page = (
    messages: Message[],
    pageNumber: number,
  ): MessageThreadPage => ({
    messages,
    pagination: { page: pageNumber, totalPages: 4, total: 100, size: 25 },
  });
  const initial: InfiniteData<MessageThreadPage> = {
    pages: [
      page([message("duplicate", "newest"), message("delete")], 1),
      page(
        [message("duplicate", "older snapshot"), message("older", "older", 0)],
        2,
      ),
    ],
    pageParams: [1, 2],
  };
  const sibling = { pages: [page([message("sibling")], 1)], pageParams: [1] };
  client.setQueryData(threadKey, initial);
  client.setQueryData(siblingKey, sibling);
  const summary: ConversationSummary = {
    user: { id: "them", username: "Them", avatar: "" },
  };
  client.setQueryData<ConversationListData>(conversationKey, {
    items: [summary],
    total: 10,
  });
  type Setters = {
    setMessages: Dispatch<SetStateAction<Message[]>>;
    setConversations: Dispatch<SetStateAction<ConversationSummary[]>>;
    messages?: Message[];
  };
  const captured = {} as Record<string, Setters>;
  const callbacks: unknown[] = [];
  let stateIndex = 0;
  const exports = {} as { default: () => unknown };
  const ref = (current: unknown) => ({ current });
  const readQuery = ({ queryKey }: { queryKey: readonly unknown[] }) => ({
    data: client.getQueryData(queryKey),
  });
  const noop = () => {};
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessagesInbox.tsx", import.meta.url), "utf8"),
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
        if (name === "react")
          return {
            useCallback: (callback: unknown) => {
              callbacks.push(callback);
              return callback;
            },
            useMemo: (callback: () => unknown) => callback(),
            useEffect: noop,
            useRef: ref,
            // The second local state is the selected conversation.
            useState: (initialValue: unknown) => [
              stateIndex++ === 1 ? "them" : initialValue,
              noop,
            ],
          };
        if (name === "react/jsx-runtime") return { jsx: noop, jsxs: noop };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => client,
            useQuery: readQuery,
            useInfiniteQuery: readQuery,
          };
        if (name === "next/navigation")
          return { usePathname: () => "/messages/them" };
        if (name === "nextjs-toploader/app") return { useRouter: () => ({}) };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              user: { id: "me", username: "Me" },
              isAuthenticated: true,
              isLoading: true,
              bans: {},
            }),
          };
        if (name === "@/contexts/TwemojiContext")
          return { useTwemoji: () => ({ twemojiEnabled: false }) };
        if (name === "@/hooks/useEmojiStringMap")
          return { useEmojiStringMap: () => ({}) };
        if (name === "@/hooks/useLockBodyScroll")
          return { useLockBodyScroll: noop };
        if (name === "@/hooks/useMessageNavigationScroll")
          return {
            useMessageNavigationScroll: () => ({
              selectedUserIdRef: ref("them"),
              routeConversationIdRef: ref("them"),
              messagesContainerRef: ref(null),
            }),
          };
        if (name === "@/hooks/useLocalMessageOverlay")
          return {
            useLocalMessageOverlay: () => ({
              localThreadMessagesByUserIdRef: ref(new Map()),
            }),
          };
        if (name === "@/hooks/useMessagesRealtime")
          return {
            useMessagesRealtime: (options: Setters) => {
              captured.realtime = options;
              return { typingUserIds: [] };
            },
          };
        if (name === "@/hooks/useSendMessage")
          return {
            useSendMessage: (options: Setters) => {
              captured.send = options;
              return {};
            },
          };
        if (name === "@/hooks/useMessageMutations")
          return {
            useMessageMutations: (options: Setters) => {
              captured.mutations = options;
              return {};
            },
          };
        if (name === "@/hooks/useConversationList")
          return { useConversationList: noop };
        if (name === "@/hooks/useMessageThread")
          return { useMessageThread: noop };
        if (name === "@/hooks/useUserSearch")
          return { useUserSearch: () => ({ results: [] }) };
        if (name === "@/hooks/useMessageBlocking")
          return { useMessageBlocking: () => ({}) };
        if (name === "@/hooks/useOfferDetailsBatch")
          return { useOfferDetailsBatch: () => new Map() };
        if (name === "@/hooks/useSharedTimer")
          return { useOptimizedRealTimeRelativeDate: () => "" };
        if (name === "@/utils/messages/parsing")
          return { asId: String, parseOfferAcceptedMetadata: () => null };
        return {};
      },
    },
  );
  try {
    exports.default();
    expect(
      captured.mutations.messages
        ?.filter(({ id }) => id === "duplicate")
        .map(({ content }) => content),
    ).toEqual(["newest"]);
    expect(captured.send.setMessages).toBe(captured.realtime.setMessages);
    expect(captured.mutations.setMessages).toBe(captured.realtime.setMessages);
    captured.mutations.setMessages((messages) =>
      messages
        .filter(({ id }) => id !== "delete")
        .map((item) =>
          item.id === "older" ? { ...item, content: "edited" } : item,
        ),
    );
    captured.realtime.setMessages((messages) => [
      ...messages,
      message("incoming", "incoming", 2),
    ]);
    const result =
      client.getQueryData<InfiniteData<MessageThreadPage>>(threadKey)!;
    expect(result.pageParams).toEqual(initial.pageParams);
    expect(result.pages.map(({ pagination }) => pagination)).toEqual(
      initial.pages.map(({ pagination }) => pagination),
    );
    expect(result.pages[0].messages.map(({ id }) => id)).toEqual([
      "duplicate",
      "incoming",
    ]);
    expect(result.pages[1].messages.map(({ content }) => content)).toEqual([
      "newest",
      "edited",
    ]);
    expect(
      client.getQueryData<InfiniteData<MessageThreadPage>>(siblingKey),
    ).toEqual(sibling);

    client.removeQueries({ queryKey: threadKey, exact: true });
    captured.send.setMessages([message("pending")]);
    expect(
      client.getQueryData<InfiniteData<MessageThreadPage>>(threadKey),
    ).toEqual({
      pages: [
        {
          messages: [message("pending")],
          pagination: { page: 1, totalPages: null },
        },
      ],
      pageParams: [1],
    });
    expect(
      client.getQueryData<InfiniteData<MessageThreadPage>>(siblingKey),
    ).toEqual(sibling);

    // These are the actual useCallback adapters, after the two content formatters.
    const setTotal = callbacks[3] as Dispatch<SetStateAction<number | null>>;
    setTotal((total) => (total ?? 0) + 1);
    captured.realtime.setConversations((items) => [
      ...items,
      { ...summary, user: { ...summary.user, id: "other" } },
    ]);
    expect(
      client.getQueryData<ConversationListData>(conversationKey)?.total,
    ).toBe(11);
    expect(
      client.getQueryData<ConversationListData>(conversationKey)?.items,
    ).toHaveLength(2);
    setTotal(12);
    expect(
      client.getQueryData<ConversationListData>(conversationKey)?.items,
    ).toHaveLength(2);
  } finally {
    client.clear();
  }
});
