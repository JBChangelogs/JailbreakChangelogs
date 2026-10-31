import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { getResponseErrorMessage } from "@/utils/api/api";
import * as parsing from "@/utils/messages/parsing";
import * as formatting from "@/utils/messages/formatting";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import type {
  ConversationListData,
  useConversationList,
} from "./useConversationList";
import { sortConversationsByLatestMessage } from "@/utils/messages/sorting";

test("route user failures preserve backend messages, batch failures do not become empty conversations, and auth loading retains the route", async () => {
  type Query = {
    queryKey: string[];
    queryFn: (context: { signal?: AbortSignal }) => Promise<unknown>;
  };
  const queries = new Map<string, Query>();
  let effects: (() => unknown)[] = [];
  let routeError: { id: string; message: string } | null = null;
  let finishLookup: () => void = () => {};
  const lookupFinished = new Promise<void>((resolve) => {
    finishLookup = resolve;
  });
  const selections: unknown[] = [];
  let batchAvailable = false;
  const conversationItems: Record<string, unknown>[] = [
    {
      id: "1",
      sender_id: "me",
      receiver_id: "them",
      content: "hello",
      created_at: 1,
    },
  ];
  const exports = {} as { useConversationList: typeof useConversationList };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useConversationList.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      fetch: async (url: string) => {
        if (url.includes("/users/batch"))
          return batchAvailable
            ? new Response(
                JSON.stringify([
                  { id: "them", username: "Them", avatar: "" },
                  { id: "123", username: "New friend", avatar: "" },
                ]),
              )
            : new Response(
                JSON.stringify({ message: "User lookup unavailable." }),
                { status: 503 },
              );
        if (url.includes("/blocked-users"))
          return new Response(JSON.stringify({ detail: "Unauthorized" }), {
            status: 401,
          });
        if (url.endsWith("/conversations"))
          return new Response(
            JSON.stringify({
              items: conversationItems,
              total_conversations: conversationItems.length,
            }),
          );
        return new Response(
          JSON.stringify({
            error: "user_not_found",
            message: "User not found.",
          }),
          { status: 404 },
        );
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useCallback: (fn: unknown) => fn,
            useRef: (current: unknown) => ({ current }),
            useEffect: (effect: () => unknown) => effects.push(effect),
            useState: () => [
              routeError,
              (error: typeof routeError) => {
                routeError = error;
                finishLookup();
              },
            ],
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({
              getQueryData: () => undefined,
              fetchQuery: (query: Query) => query.queryFn({}),
              setQueryData: () => {},
            }),
            useQuery: (query: Query) => {
              queries.set(query.queryKey[0], query);
              return { isFetched: true, isSuccess: false };
            },
          };
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://api.example.test",
            getResponseErrorMessage,
          };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        if (name === "@/utils/api/parseJsonWithLargeIds")
          return { parseJsonWithLargeIds };
        if (name === "@/utils/messages/parsing") return parsing;
        if (name === "@/utils/messages/formatting") return formatting;
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "sonner") return { toast: { error: () => {} } };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const options: Parameters<typeof useConversationList>[0] = {
    isAuthenticated: true,
    currentUserId: "me",
    currentUserMessageUser: null,
    selectedUserId: "them",
    routeConversationId: "them",
    routeConversationIdRef: { current: "them" },
    conversations: [],
    setConversations: () => {},
    setSelectedUserId: (value) => {
      selections.push(value);
    },
    refreshKey: 0,
  };
  exports.useConversationList(options);
  effects.forEach((effect) => effect());
  await lookupFinished;
  expect(exports.useConversationList(options).routeUserError).toEqual({
    id: "them",
    message: "User not found.",
  });
  await expect(queries.get("conversation-list")!.queryFn({})).rejects.toThrow(
    "User lookup unavailable.",
  );
  await expect(queries.get("blocked-users")!.queryFn({})).rejects.toThrow(
    "Unauthorized",
  );

  // Friend acceptance opens a conversation before either user sends a message.
  batchAvailable = true;
  conversationItems.push({
    recipient_id: "123",
    opened_at: 1761771600,
    message: null,
    message_count: 0,
    unread_count: 0,
  });
  const list = (await queries
    .get("conversation-list")!
    .queryFn({})) as ConversationListData;
  expect(list.total).toBe(2);
  expect(list.items.map((item) => item.user.id)).toEqual(["123", "them"]);
  expect(list.items[0]).toMatchObject({
    lastMessage: undefined,
    openedAt: 1761771600000,
    messageCount: 0,
    unreadCount: 0,
  });
  expect(list.items[1].lastMessage?.content).toBe("hello");
  expect(sortConversationsByLatestMessage([...list.items].reverse())).toEqual(
    list.items,
  );
  effects = [];
  options.isAuthenticated = false;
  options.currentUserId = null;
  exports.useConversationList(options);
  effects.forEach((effect) => effect());
  expect(selections.at(-1)).toBe("them");
});
