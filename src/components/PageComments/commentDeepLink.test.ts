import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("comment links show only their thread, and the list merges loaded pages", async () => {
  let effects: { callback: () => unknown; deps: unknown[] }[] = [];
  const hookStates: unknown[] = [];
  let hookIndex = 0;
  const requests: string[] = [];
  const historyOptions: unknown[] = [];
  const paramUpdates: Record<string, string | number | null>[] = [];
  let timer: () => Promise<void>;
  let lookupStatus = 200;
  let scrolls = 0;
  const initialComments: unknown[] = [];
  const cache = new Map<string, unknown>();
  const cancelled: unknown[] = [];
  const queryClient = {
    cancelQueries: async (filter: unknown) => {
      cancelled.push(filter);
    },
    setQueryData: (key: unknown, updater: unknown) => {
      const cacheKey = JSON.stringify(key);
      cache.set(
        cacheKey,
        typeof updater === "function" ? updater(cache.get(cacheKey)) : updater,
      );
    },
    invalidateQueries: async () => {},
    fetchQuery: async (options: {
      queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
    }) => options.queryFn({ signal: new AbortController().signal }),
  };
  const location = {
    hash: "#comment-42",
    pathname: "/changelogs/5",
    search: "?tab=comments",
  };
  type State = {
    comments: { id: number }[];
    totalComments: number;
    focusedThread: { page: number; commentId: number } | null;
    sortOrder: string | null;
    handleSortChange: (sort: string) => void;
    showAllComments: () => void;
    setComments: (
      updater: (comments: { id: number }[]) => { id: number }[],
    ) => void;
  };
  const exports = {} as { useCommentState: (props: unknown) => State };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useCommentState.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      Set,
      Map,
      Array,
      Object,
      document: {
        querySelector: () => null,
        querySelectorAll: (selector: string) =>
          selector === "#comment-42"
            ? [
                {
                  getClientRects: () => [true],
                  scrollIntoView: () => {
                    scrolls++;
                  },
                  querySelector: () => ({
                    classList: { add: () => {}, remove: () => {} },
                  }),
                },
              ]
            : [],
      },
      requestAnimationFrame: (callback: () => void) => {
        callback();
        return 1;
      },
      cancelAnimationFrame: () => {},
      URL,
      URLSearchParams,
      localStorage: { setItem: () => {} },
      CustomEvent: class {},
      setTimeout: (callback: typeof timer, delay: number) => {
        if (delay !== 10_000) timer = callback;
        return 1;
      },
      clearTimeout: () => {},
      window: {
        location,
        history: {
          replaceState: (_state: unknown, _title: string, path: string) => {
            expect(path).toBe(location.pathname + location.search);
            location.hash = "";
          },
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      },
      fetch: async (url: string) => {
        requests.push(url);
        return Response.json(
          { comment_id: 10, item_id: 5, item_type: "changelog", page: 3 },
          { status: lookupStatus },
        );
      },
      require: (name: string) => {
        if (name === "nuqs")
          return {
            parseAsString: {},
            useQueryStates: () => {
              const params = new URLSearchParams(location.search);
              return [
                { commentsSort: params.get("commentsSort") },
                (
                  values: Record<string, string | number | null>,
                  options?: unknown,
                ) => {
                  paramUpdates.push(values);
                  historyOptions.push(options);
                  for (const [key, value] of Object.entries(values)) {
                    if (value === null) params.delete(key);
                    else params.set(key, String(value));
                  }
                  location.search = "?" + params.toString();
                },
              ];
            },
          };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = hookIndex++;
              if (!(index in hookStates)) hookStates[index] = initial;
              return [
                hookStates[index],
                (update: unknown) => {
                  hookStates[index] =
                    typeof update === "function"
                      ? update(hookStates[index])
                      : update;
                },
              ];
            },
            useRef: (initial: unknown) => ({ current: initial }),
            useEffect: (callback: () => unknown, deps: unknown[]) => {
              effects.push({ callback, deps });
            },
            useCallback: (callback: unknown) => callback,
            useMemo: (callback: () => unknown) => callback(),
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => queryClient,
            useQuery: (options: { queryKey: unknown }) => ({
              data: cache.get(JSON.stringify(options.queryKey)),
            }),
            useInfiniteQuery: (options: { queryKey: unknown }) => ({
              data: cache.get(JSON.stringify(options.queryKey)),
              fetchNextPage: () => {},
            }),
          };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user: null, bans: {} }) };
        if (name === "@/hooks/useSupporterModal")
          return { useSupporterModal: () => ({}) };
        if (name === "@/hooks/useEmojiStringMap")
          return { useEmojiStringMap: () => ({}) };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://public-api.example.com" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        return {};
      },
    },
  );
  const props = {
    changelogId: 5,
    type: "changelog",
    changelogTitle: "Update",
    initialComments,
  };
  const render = () => {
    hookIndex = 0;
    effects = [];
    return exports.useCommentState(props);
  };
  const runLoadEffect = async () => {
    effects
      .find((entry) => entry.deps[0] === 5 && entry.deps.includes(queryClient))!
      .callback();
    await timer!();
  };
  const page = (ids: number[], pageNumber = 1) => ({
    comments: ids.map((id) => ({ id })),
    userMap: {},
    totalPages: 3,
    totalComments: 25,
    page: pageNumber,
  });

  // Comment link: look up its page, then show only that thread.
  render();
  await runLoadEffect();
  expect(requests[0]).toBe(
    "https://public-api.example.com/v2/comments/42/page",
  );
  expect(paramUpdates).toEqual([]);
  const threadKey = ["comments", "changelog", 5, "thread", 3, null];
  cache.set(JSON.stringify(threadKey), page([9, 10, 11], 3));
  let state = render();
  expect(state.focusedThread).toEqual({ page: 3, commentId: 10 });
  expect(state.comments.map((comment) => comment.id)).toEqual([10]);
  expect(state.totalComments).toBe(25);
  expect(
    hookStates.some((value) => value instanceof Set && value.has(10)),
  ).toBe(true);
  effects.find((entry) => entry.deps[0] === state.comments)!.callback();
  expect(scrolls).toBe(1);

  // Edits in a thread write to the thread's page.
  state.setComments((comments) =>
    comments.map((comment) => ({ ...comment, edited: true })),
  );
  expect(cancelled).toContainEqual({ queryKey: threadKey, exact: true });
  expect(
    (cache.get(JSON.stringify(threadKey)) as { comments: unknown[] }).comments,
  ).toContainEqual({ id: 10, edited: true });

  // "View all" leaves the thread and clears the hash.
  state.showAllComments();
  expect(location.hash).toBe("");
  state = render();
  expect(state.focusedThread).toBeNull();

  // Thread page no longer has the comment: fall back to the list.
  location.hash = "#comment-42";
  render();
  await runLoadEffect();
  cache.set(JSON.stringify(threadKey), page([9, 11], 3));
  render();
  effects
    .find((entry) => entry.deps[1] === cache.get(JSON.stringify(threadKey)))!
    .callback();
  expect(render().focusedThread).toBeNull();

  // Missing comment link: show the full list.
  lookupStatus = 404;
  location.hash = "#comment-42";
  render();
  await runLoadEffect();
  expect(render().focusedThread).toBeNull();

  // List merges loaded pages, dedupes, and updates write across all of them.
  location.hash = "";
  const listKey = ["comments", "changelog", 5, "list", null, null];
  cache.set(JSON.stringify(listKey), {
    pages: [page([7, 8]), page([8, 9], 2)],
    pageParams: [1, 2],
  });
  state = render();
  expect(state.comments.map((comment) => comment.id)).toEqual([7, 8, 9]);
  state.setComments((comments) => [{ id: 99 }, ...comments]);
  expect(cancelled).toContainEqual({ queryKey: listKey, exact: true });
  expect(render().comments.map((comment) => comment.id)).toEqual([99, 7, 8, 9]);
  render().setComments((comments) =>
    comments.filter((comment) => comment.id !== 8),
  );
  expect(render().comments.map((comment) => comment.id)).toEqual([99, 7, 9]);

  // Sort changes push history without a page param.
  render().handleSortChange("oldest");
  expect(paramUpdates.at(-1)).toEqual({ commentsSort: "oldest" });
  expect(historyOptions.at(-1)).toEqual({ history: "push" });
  expect(new URLSearchParams(location.search).get("tab")).toBe("comments");
});
