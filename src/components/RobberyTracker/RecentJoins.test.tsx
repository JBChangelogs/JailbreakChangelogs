import { expect, test } from "bun:test";
import {
  InfiniteQueryObserver,
  QueryClient,
  replaceEqualDeep,
  type InfiniteData,
  type InfiniteQueryObserverOptions,
} from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("recent joins keep loaded pages, update realtime cache, and retry a failed next page", async () => {
  const client = new QueryClient();
  const effects: Array<{ callback: () => void; deps: unknown[] }> = [];
  let options!: InfiniteQueryObserverOptions<Page, Error, InfiniteData<Page>>;
  let result: { isFetching?: boolean; data?: InfiniteData<Page> } = {
    isFetching: false,
  };
  let failNext = false;
  let empty = false;
  let finishNext: (() => void) | undefined;
  let delayNext = false;
  const requests: number[] = [];
  const first = {
    timestamp: "2026-10-07T00:00:00Z",
    marker_name: "Bank",
    display_name: "Bank",
    tracker_type: "robbery",
  };
  const second = { ...first, timestamp: "2026-10-06T00:00:00Z" };
  type Page = {
    items: Array<typeof first>;
    page: number;
    total_pages: number;
    total: number;
    size: number;
  };
  const exports = {} as { default: (props: unknown) => unknown };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./RecentJoins.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Set,
      Date,
      URL,
      Error,
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (value: unknown) => [
              typeof value === "function" ? value() : value,
              () => {},
            ],
            useRef: () => ({ current: null }),
            useMemo: (callback: () => unknown) => callback(),
            useEffect: (callback: () => void, deps: unknown[]) =>
              effects.push({ callback, deps }),
          };
        if (name === "react/jsx-runtime")
          return {
            jsx: (type: unknown, props: unknown) => ({ type, props }),
            jsxs: (type: unknown, props: unknown) => ({ type, props }),
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => client,
            replaceEqualDeep,
            useInfiniteQuery: (value: unknown) => {
              options = value as typeof options;
              return result;
            },
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              user: { id: "viewer" },
              isAuthenticated: true,
            }),
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example.com" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        return {};
      },
      fetch: async (url: string) => {
        const page = Number(new URL(url).searchParams.get("page"));
        requests.push(page);
        if (empty)
          return Response.json({ error: "no_history_found" }, { status: 404 });
        if (page === 2 && failNext) return Response.json({}, { status: 503 });
        if (page === 2 && delayNext)
          await new Promise<void>((resolve) => {
            finishNext = resolve;
          });
        return Response.json({
          items: page === 1 ? [first] : [first, second],
          total: 2,
          page,
          total_pages: 2,
          size: 1,
        });
      },
    },
  );
  exports.default({ trackerType: "robbery", recentJoin: null });
  expect(options.enabled).toBe(false);
  expect(options.queryKey).toEqual(["recent-joins", "robbery", "viewer"]);
  const observer = new InfiniteQueryObserver<Page, Error, InfiniteData<Page>>(
    client,
    options,
  );
  const unsubscribe = observer.subscribe(() => {});
  await observer.refetch();
  expect(observer.getCurrentResult().data?.pages).toHaveLength(1);
  failNext = true;
  await observer.fetchNextPage();
  expect(observer.getCurrentResult().isError).toBe(true);
  expect(observer.getCurrentResult().data?.pages).toHaveLength(1);
  failNext = false;
  delayNext = true;
  const nextRequest = observer.fetchNextPage();
  await new Promise<void>((resolve) => setImmediate(resolve));
  result = observer.getCurrentResult();
  const recent = { id: "realtime-join", item: second };
  effects.length = 0;
  exports.default({ trackerType: "robbery", recentJoin: recent });
  effects.find((effect) => effect.deps.includes(recent))!.callback();
  finishNext!();
  await nextRequest;
  const pages = client.getQueryData<InfiniteData<Page>>(
    options.queryKey,
  )!.pages;
  expect(pages).toHaveLength(2);
  expect(requests).toEqual([1, 2, 2]);
  expect(pages[0].items[0]).toEqual(second);
  expect(pages[1].items).toEqual([first, second]);
  empty = true;
  const emptyData = await client.fetchInfiniteQuery({
    ...options,
    queryKey: ["empty-joins"],
  });
  expect(emptyData.pages[0]).toMatchObject({ items: [], total_pages: 0 });
  unsubscribe();
  client.clear();
});
