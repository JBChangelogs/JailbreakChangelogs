import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("comment links locate the correct page, expand the thread, and fall back when a comment is missing", async () => {
  const effects: { callback: () => unknown; deps: unknown[] }[] = [];
  const updates: unknown[] = [];
  const requests: string[] = [];
  let timer: () => Promise<void>;
  let clearHighlight: () => void;
  const highlighted = new Set<string>();
  const surface = {
    classList: {
      add: (name: string) => highlighted.add(name),
      remove: (name: string) => highlighted.delete(name),
    },
  };
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
    fetchQuery: async (options: {
      queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
    }) => options.queryFn({ signal: new AbortController().signal }),
  };
  const location = {
    hash: "#comment-42",
    pathname: "/changelogs/5",
    search: "?tab=comments",
  };
  const exports = {} as {
    useCommentState: (props: unknown) => {
      comments: { id: number }[];
      totalComments: number;
      setComments: (
        updater: (comments: { id: number }[]) => { id: number }[],
      ) => void;
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useCommentState.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      Set,
      document: {
        querySelectorAll: (selector: string) =>
          selector === "#comment-42"
            ? [
                { getClientRects: () => [] },
                {
                  getClientRects: () => [true],
                  scrollIntoView: () => {
                    scrolls++;
                  },
                  querySelector: () => surface,
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
      setTimeout: (callback: typeof timer, delay: number) => {
        if (delay === 10_000) clearHighlight = callback;
        else timer = callback;
        return 1;
      },
      clearTimeout: () => {},
      window: {
        location,
        history: {
          replaceState: (_state: unknown, _title: string, path: string) => {
            expect(path).toBe("/changelogs/5?tab=comments");
            location.hash = "";
          },
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      fetch: async (url: string) => {
        requests.push(url);
        return url.includes("/42/page")
          ? Response.json(
              { comment_id: 10, item_id: 5, item_type: "changelog", page: 3 },
              { status: lookupStatus },
            )
          : Response.json({
              items: [],
              total_pages: 3,
              total: 25,
              page: Number(new URL(url).searchParams.get("page")),
            });
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (initial: unknown) => [
              initial,
              (update: unknown) => {
                updates.push(
                  typeof update === "function" ? update(initial) : update,
                );
              },
            ],
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
          return {
            PUBLIC_API_URL: "https://public-api.example.com",
            flattenComments: () => ({ comments: [], userMap: {} }),
          };
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
  const state = exports.useCommentState(props);
  const effect = effects.find(
    (entry) => entry.deps[0] === 5 && entry.deps.includes(queryClient),
  );
  expect(effect).toBeDefined();
  effect!.callback();
  await timer!();
  expect(requests[0]).toBe(
    "https://public-api.example.com/v2/comments/42/page",
  );
  const listUrl = new URL(requests[1]);
  expect(listUrl.searchParams.get("page")).toBe("3");
  expect(listUrl.searchParams.get("sort")).toBe("newest");
  expect(
    updates.some((update) => update instanceof Set && update.has(10)),
  ).toBe(true);
  const scrollEffect = effects.find(
    (entry) => entry.deps[0] === initialComments && entry.deps.length === 2,
  );
  expect(scrollEffect).toBeDefined();
  scrollEffect!.callback();
  scrollEffect!.callback();
  expect(scrolls).toBe(1);
  expect(highlighted.has("comment-link-highlight")).toBe(true);
  clearHighlight!();
  expect(highlighted.size).toBe(0);
  expect(location.hash).toBe("");
  location.hash = "#comment-42";
  location.pathname = "/seasons/6";
  clearHighlight!();
  expect(location.hash).toBe("#comment-42");
  location.pathname = "/changelogs/5";
  lookupStatus = 404;
  effect!.callback();
  await timer!();
  expect(new URL(requests.at(-1)!).searchParams.get("page")).toBe("1");

  const key = ["comments", "changelog", 5, 1, null, null];
  queryClient.setQueryData(key, {
    comments: [{ id: 7 }],
    userMap: {},
    totalPages: 3,
    totalComments: 25,
    page: 1,
  });
  state.setComments((comments) => [...comments, { id: 99 }]);
  const next = exports.useCommentState(props);
  expect(next.comments.map((comment) => comment.id)).toEqual([7, 99]);
  expect(next.totalComments).toBe(25);
  expect(cancelled).toContainEqual({ queryKey: key, exact: true });
});
