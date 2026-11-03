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
  let fetchOverride:
    | ((url: string, init?: RequestInit) => Promise<Response>)
    | undefined;
  const deleteErrors: string[] = [];
  let authUser: {
    id: string;
    flags?: { flag: string; enabled: boolean }[];
  } | null = null;
  const listeners = new Map<string, (event: unknown) => void>();
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
    getQueryData: (key: unknown) => cache.get(JSON.stringify(key)),
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
    isProfileOwner: boolean;
    canDeleteAnyComment: boolean;
    profileCommentsDisabled: boolean;
    isBlocked: boolean;
    comments: { id: number; replies?: { id: number; date: string }[] }[];
    handleDeleteComment: (id: number) => Promise<void>;
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
          selector === "#comment-42" || selector === "#comments"
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
        addEventListener: (name: string, listener: (event: unknown) => void) =>
          listeners.set(name, listener),
        removeEventListener: () => {},
        dispatchEvent: () => {},
      },
      fetch: async (url: string, init?: RequestInit) => {
        requests.push(url);
        if (fetchOverride) return fetchOverride(url, init);
        const thread = /\/v2\/comments\/(\d+)$/.exec(url)?.[1];
        if (thread && thread !== "42")
          return Response.json({
            id: Number(thread),
            replies: [
              { id: Number(thread) * 10, date: "1700000000" },
              { id: Number(thread) * 10 + 1, date: "1700000100" },
            ],
          });
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
            useRef: (initial: unknown) => {
              const index = hookIndex++;
              if (!(index in hookStates))
                hookStates[index] = { current: initial };
              return hookStates[index];
            },
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
          return {
            useAuthContext: () => ({
              user: authUser,
              isAuthenticated: !!authUser,
              bans: {},
            }),
          };
        if (name === "@/hooks/useSupporterModal")
          return { useSupporterModal: () => ({}) };
        if (name === "@/hooks/useEmojiStringMap")
          return { useEmojiStringMap: () => ({}) };
        if (name === "sonner")
          return {
            toast: { error: (message: string) => deleteErrors.push(message) },
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://public-api.example.com",
            flattenComments: (data: { items: unknown[] }) => ({
              comments: data.items,
              userMap: {},
            }),
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
    changelogId: 5 as string | number,
    type: "changelog",
    allowProfileComments: true,
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

  // Realtime updates patch only the named threads, keeping each page's comments.
  location.search = "?tab=comments";
  cache.set(JSON.stringify(listKey), {
    pages: [page([7, 8]), page([9, 11], 2)],
    pageParams: [1, 2],
  });
  render();
  effects
    .find((entry) => String(entry.callback).includes("realtimeComments"))!
    .callback();
  listeners.get("realtimeComments")!({
    detail: {
      updates: [
        { id: 80, type: "created", parent_id: 8 },
        { id: 5, type: "created", parent_id: null },
        { id: 9, type: "deleted", parent_id: null },
        { id: 404, type: "edited", parent_id: null },
      ],
    },
  });
  for (let i = 0; i < 5; i++) await Bun.sleep(0);
  const list = cache.get(JSON.stringify(listKey)) as {
    pages: {
      comments: { id: number; replies?: { id: number; date: string }[] }[];
      totalComments: number;
    }[];
  };
  expect(list.pages.map((p) => p.comments.map((c) => c.id))).toEqual([
    [5, 7, 8],
    [11],
  ]);
  expect(list.pages[0].comments[2].replies).toEqual([
    { id: 81, date: "1700000100" },
    { id: 80, date: "1700000000" },
  ]);
  // Total counts replies too: thread 8 gained 80 and 81.
  expect(list.pages[0].totalComments).toBe(27);
  expect(requests).not.toContain(
    "https://public-api.example.com/v2/comments/404",
  );

  // Thread refreshes after posting/editing preserve newest-first replies in every list sort.
  for (const sort of ["newest", "oldest", "activity"]) {
    location.search = `?tab=comments&commentsSort=${sort}`;
    const sortedKey = ["comments", "changelog", 5, "list", sort, null];
    const sortedPage = page(sort === "oldest" ? [7, 8] : [8, 7]);
    cache.set(JSON.stringify(sortedKey), {
      pages: [sortedPage],
      pageParams: [1],
    });
    state = render();
    state.setComments((comments) =>
      comments.map((comment) =>
        comment.id === 8
          ? {
              ...comment,
              replies: [
                { id: 81, date: "1700000100" },
                { id: 80, date: "1700000000" },
              ],
            }
          : comment,
      ),
    );
    render();
    effects
      .find((entry) => String(entry.callback).includes("realtimeComments"))!
      .callback();
    listeners.get("realtimeComments")!({
      detail: { updates: [{ id: 81, type: "created", parent_id: 8 }] },
    });
    for (let i = 0; i < 5; i++) await Bun.sleep(0);
    const refreshed = cache.get(JSON.stringify(sortedKey)) as typeof list;
    expect(refreshed.pages[0].comments.map((comment) => comment.id)).toEqual(
      sortedPage.comments.map((comment) => comment.id),
    );
    expect(
      refreshed.pages[0].comments.find((comment) => comment.id === 8)?.replies,
    ).toEqual([
      { id: 81, date: "1700000100" },
      { id: 80, date: "1700000000" },
    ]);
  }

  // Rapid deletes must stay removed when an older refresh arrives last.
  location.search = "?tab=comments&commentsSort=newest";
  const deleteKey = ["comments", "changelog", 5, "list", "newest", null];
  const pendingRequests: {
    url: string;
    method: string;
    resolve: (response: Response) => void;
  }[] = [];
  fetchOverride = (url, init) =>
    new Promise((resolve) => {
      pendingRequests.push({ url, method: init?.method ?? "GET", resolve });
    });
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Bun.sleep(0);
  };
  const seedReplies = (ids: number[]) => {
    cache.set(JSON.stringify(deleteKey), {
      pages: [
        {
          ...page([8]),
          comments: [
            { id: 8, replies: ids.map((id) => ({ id, date: String(id) })) },
          ],
        },
      ],
      pageParams: [1],
    });
    return render();
  };
  const visibleReplies = () =>
    render().comments[0].replies?.map((reply) => reply.id);
  state = seedReplies([83, 82]);
  const deleteFirst = state.handleDeleteComment(83);
  const firstRequest = pendingRequests.shift()!;
  expect(firstRequest.method).toBe("DELETE");
  firstRequest.resolve(Response.json({}));
  await deleteFirst;
  const staleRefresh = pendingRequests.shift()!;
  expect(staleRefresh.method).toBe("GET");
  const deleteSecond = render().handleDeleteComment(82);
  const secondRequest = pendingRequests.shift()!;
  expect(visibleReplies()).toEqual([]);
  // The first refresh still includes the second reply while its delete is pending.
  staleRefresh.resolve(
    Response.json({ id: 8, replies: [{ id: 82, date: "82" }] }),
  );
  await flush();
  expect(visibleReplies()).toEqual([]);
  secondRequest.resolve(Response.json({}));
  await deleteSecond;
  pendingRequests.shift()!.resolve(Response.json({ id: 8, replies: [] }));
  await flush();
  expect(visibleReplies()).toEqual([]);

  // A failed second delete restores only that reply, never the successfully deleted first one.
  state = seedReplies([85, 84]);
  const successfulDelete = state.handleDeleteComment(85);
  const successRequest = pendingRequests.shift()!;
  const failedDelete = render().handleDeleteComment(84);
  const failureRequest = pendingRequests.shift()!;
  successRequest.resolve(Response.json({}));
  await successfulDelete;
  const oldRefresh = pendingRequests.shift()!;
  failureRequest.resolve(Response.json({}, { status: 500 }));
  await failedDelete;
  expect(visibleReplies()).toEqual([84]);
  expect(deleteErrors).toEqual(["Failed to delete comment"]);
  oldRefresh.resolve(
    Response.json({
      id: 8,
      replies: [
        { id: 85, date: "85" },
        { id: 84, date: "84" },
      ],
    }),
  );
  await flush();
  expect(visibleReplies()).toEqual([84]);
  // The hidden deleted reply cannot be deleted again through a stale handler.
  await render().handleDeleteComment(85);
  expect(pendingRequests).toHaveLength(0);
  // Root comment rollback also leaves another successful deletion removed.
  cache.set(JSON.stringify(deleteKey), {
    pages: [page([10, 9])],
    pageParams: [1],
  });
  const firstRootDelete = render().handleDeleteComment(10);
  const firstRootRequest = pendingRequests.shift()!;
  const secondRootDelete = render().handleDeleteComment(9);
  const secondRootRequest = pendingRequests.shift()!;
  firstRootRequest.resolve(Response.json({}));
  await firstRootDelete;
  secondRootRequest.resolve(Response.json({}, { status: 500 }));
  await secondRootDelete;
  expect(render().comments.map((comment) => comment.id)).toEqual([9]);
  expect(render().totalComments).toBe(24);
  expect(pendingRequests).toHaveLength(0);
  fetchOverride = undefined;

  // Sort changes push history without a page param.
  render().handleSortChange("oldest");
  expect(paramUpdates.at(-1)).toEqual({ commentsSort: "oldest" });
  expect(historyOptions.at(-1)).toEqual({ history: "push" });
  expect(new URLSearchParams(location.search).get("tab")).toBe("comments");

  props.type = "user";
  props.changelogId = "123456789012345678";
  props.allowProfileComments = false;
  expect(render().profileCommentsDisabled).toBe(true);
  expect(render().canDeleteAnyComment).toBe(false);
  authUser = { id: String(props.changelogId) };
  render();
  effects.find((entry) => entry.deps.includes(authUser))!.callback();
  expect(render().isProfileOwner).toBe(true);
  expect(render().canDeleteAnyComment).toBe(false);
  expect(render().profileCommentsDisabled).toBe(false);
  expect(render().isBlocked).toBe(false);
  authUser = { id: "visitor" };
  render();
  effects.find((entry) => entry.deps.includes(authUser))!.callback();
  expect(render().canDeleteAnyComment).toBe(false);
  expect(render().profileCommentsDisabled).toBe(true);
  props.allowProfileComments = true;
  expect(render().profileCommentsDisabled).toBe(false);
  authUser = {
    id: "moderator",
    flags: [{ flag: "website_moderator", enabled: true }],
  };
  expect(render().canDeleteAnyComment).toBe(true);
  authUser = {
    id: String(props.changelogId),
    flags: [{ flag: "is_owner", enabled: true }],
  };
  expect(render().canDeleteAnyComment).toBe(true);
  authUser.flags![0]!.enabled = false;
  expect(render().canDeleteAnyComment).toBe(false);
  location.hash = "#comments";
  render();
  const previousScrolls = scrolls;
  effects
    .find((entry) => entry.deps.length === 3 && entry.deps[2] === "user")!
    .callback();
  expect(scrolls).toBe(previousScrolls + 1);
  expect(location.hash).toBe("#comments");
});
