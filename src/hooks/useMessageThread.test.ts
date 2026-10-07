import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import {
  InfiniteQueryObserver,
  QueryClient,
  replaceEqualDeep,
  type InfiniteData,
  type InfiniteQueryObserverOptions,
} from "@tanstack/react-query";
import type { MessageThreadPage } from "./useMessageThread";
import type { Message } from "@/utils/messages/types";

test("loading older messages preserves realtime edits, deletes and incoming messages", async () => {
  let options!: InfiniteQueryObserverOptions<MessageThreadPage>;
  const exports = {} as { useMessageThread: (options: unknown) => void };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useMessageThread.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            useCallback: (callback: unknown) => callback,
            useEffect: () => {},
            useLayoutEffect: () => {},
            useRef: (current: unknown) => ({ current }),
          };
        if (name === "@tanstack/react-query")
          return {
            replaceEqualDeep,
            useInfiniteQuery: (captured: typeof options) => {
              options = captured;
              return {};
            },
            useQuery: () => ({}),
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        return {};
      },
    },
  );
  const ref = (current: unknown) => ({ current });
  exports.useMessageThread({
    currentUserId: "me",
    selectedUserId: "them",
    isAuthenticated: true,
    messagesPageRef: ref(1),
    messagesTotalPagesRef: ref(null),
    isLoadingOlderMessagesRef: ref(false),
    prependScrollRestoreRef: ref(null),
  });
  const message = (id: string, content = id): Message => ({
    id,
    senderId: "them",
    receiverId: "me",
    content,
    createdAt: 1,
  });
  const page = (
    messages: Message[],
    pageNumber: number,
  ): MessageThreadPage => ({
    messages,
    pagination: { page: pageNumber, totalPages: 2 },
  });
  const firstPage = page([message("edit"), message("delete")], 1);
  let finish!: () => void;
  const wait = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const client = new QueryClient();
  const observer = new InfiniteQueryObserver(client, {
    ...options,
    enabled: false,
    initialData: { pages: [firstPage], pageParams: [1] },
    queryFn: async () => {
      await wait;
      return page([message("older")], 2);
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
    const pending = observer.fetchNextPage();
    client.setQueryData<InfiniteData<MessageThreadPage>>(
      options.queryKey,
      (current) => ({
        ...current!,
        pages: [page([message("edit", "edited live"), message("incoming")], 1)],
      }),
    );
    finish();
    await pending;
    const data = client.getQueryData<InfiniteData<MessageThreadPage>>(
      options.queryKey,
    )!;
    expect(
      data.pages[0].messages.map(({ id, content }) => [id, content]),
    ).toEqual([
      ["edit", "edited live"],
      ["incoming", "incoming"],
    ]);
    expect(data.pages[1].messages[0].id).toBe("older");
    expect(data.pageParams).toEqual([1, 2]);

    client.setQueryData(options.queryKey, {
      pages: [firstPage, page([], 2)],
      pageParams: [1, 2],
    });
    expect(
      client.getQueryData<InfiniteData<MessageThreadPage>>(options.queryKey)
        ?.pages[0].messages,
    ).toEqual(firstPage.messages);
  } finally {
    unsubscribe();
    client.clear();
  }
});
