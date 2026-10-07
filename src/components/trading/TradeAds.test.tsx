import { expect, test } from "bun:test";
import {
  QueryClient,
  QueryObserver,
  keepPreviousData,
} from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { TradeAd } from "@/types/trading";

type Element = { type: unknown; props: Record<string, unknown> };
type Page = {
  items: TradeAd[];
  total: number;
  page: number;
  total_pages: number;
  size: number;
};
type QueryOptions = {
  queryKey: unknown[];
  placeholderData?: (
    previous: Page,
    query: { queryKey: unknown[] },
  ) => Page | undefined;
};
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("trade queries preserve viewer boundaries, clamp My Ads, and cancel stale fetches before deletion", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const mainKey = ["recent-trade-ads", "viewer", null, 3];
  const mineKey = ["recent-trade-ads", "viewer", "viewer", 1];
  const ad: TradeAd = {
    id: 7,
    author: "viewer",
    created_at: 100,
    expires: 200,
    expired: 0,
    status: "Pending",
    offering: [],
    requesting: [],
    user: {
      id: "viewer",
      username: "user",
      roblox_id: "123",
      roblox_username: "user",
    },
  };
  const original: Page = {
    items: [ad],
    total: 1,
    page: 3,
    total_pages: 3,
    size: 1,
  };
  client.setQueryData(mainKey, original);
  client.setQueryData(mineKey, { ...original, page: 1 });
  const states: unknown[] = [];
  const refs: { current: unknown }[] = [];
  let stateIndex = 0;
  let refIndex = 0;
  let tab = "";
  let myData: Page | undefined;
  const effects: { callback: () => unknown; deps: unknown[] }[] = [];
  const options: QueryOptions[] = [];
  const listeners = new Map<string, (event: unknown) => void>();
  const replacements: string[] = [];
  const deleted: number[] = [];
  const jsx = (type: unknown, props: Element["props"]): Element => ({
    type,
    props,
  });
  const exports = {} as { default: (props: unknown) => Element };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./TradeAds.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      URLSearchParams,
      URL,
      Map,
      Set,
      Date,
      window: {
        addEventListener: (name: string, callback: (event: unknown) => void) =>
          listeners.set(name, callback),
        removeEventListener: () => {},
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = stateIndex++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (update: unknown) => {
                  states[index] =
                    typeof update === "function"
                      ? update(states[index])
                      : update;
                },
              ];
            },
            useRef: (current: unknown) =>
              refs[refIndex++] ?? (refs[refIndex - 1] = { current }),
            useEffect: (callback: () => unknown, deps: unknown[]) =>
              effects.push({ callback, deps }),
            useCallback: (callback: unknown) => callback,
            useMemo: (callback: () => unknown) => callback(),
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => client,
            keepPreviousData,
            useQuery: (queryOptions: QueryOptions) => {
              options.push(queryOptions);
              const data =
                queryOptions.queryKey[2] === "viewer" && myData
                  ? myData
                  : client.getQueryData(queryOptions.queryKey);
              return {
                data,
                isPending: !data,
                isLoading: !data,
                isPlaceholderData: false,
                isError: false,
              };
            },
          };
        if (name === "nuqs")
          return {
            useQueryState: (name: string) => [
              name === "tab" ? tab : "",
              () => {},
            ],
          };
        if (name === "next/navigation")
          return {
            usePathname: () => "/trading",
            useSearchParams: () => new URLSearchParams("page=3"),
          };
        if (name === "nextjs-toploader/app")
          return {
            useRouter: () => ({
              replace: (url: string) => replacements.push(url),
            }),
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              user: { id: "viewer", roblox_id: "123" },
              isAuthenticated: true,
            }),
          };
        if (name === "@/hooks/useUserFavorites")
          return { useUserFavorites: () => ({ data: [] }) };
        if (name === "@/utils/api/userInventoryQuery")
          return {
            userInventoryQueryOptions: () => ({ queryKey: ["inventory"] }),
          };
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://api.example.com",
            INVENTORY_API_URL: "https://inventory.example.com",
          };
        if (name === "@/utils/trading/core")
          return {
            RateLimitError: class extends Error {},
            deleteTradeAd: async (id: number) => {
              deleted.push(id);
            },
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "sonner")
          return {
            toast: { loading: () => 1, success: () => {}, error: () => {} },
          };
        return { default: name };
      },
    },
  );
  const render = () => {
    stateIndex = 0;
    refIndex = 0;
    effects.length = 0;
    options.length = 0;
    return exports.default({ initialItems: [] });
  };
  const tree = render();
  for (const query of options.filter(
    (query) => query.queryKey[0] === "recent-trade-ads",
  )) {
    expect(query.placeholderData!(original, { queryKey: mainKey })).toBe(
      original,
    );
    expect(
      query.placeholderData!(original, {
        queryKey: ["recent-trade-ads", "other", null, 3],
      }),
    ).toBeUndefined();
  }

  let finishOldFetch!: (page: Page) => void;
  let oldSignal!: AbortSignal;
  const oldFetch = client
    .fetchQuery({
      queryKey: mainKey,
      queryFn: ({ signal }) => {
        oldSignal = signal;
        return new Promise<Page>((resolve) => {
          finishOldFetch = resolve;
        });
      },
    })
    .catch(() => undefined);
  const onDelete = elements(tree).find((element) => element.props.onDelete)
    ?.props.onDelete as () => Promise<void>;
  expect(onDelete).toBeDefined();
  await onDelete();
  expect(oldSignal.aborted).toBe(true);
  finishOldFetch(original);
  await oldFetch;
  expect(deleted).toEqual([7]);
  for (const key of [mainKey, mineKey]) {
    expect(client.getQueryData<Page>(key)?.items).toEqual([]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  }

  tab = "myads";
  states[0] = 4;
  myData = { ...original, page: 2, total_pages: 2 };
  render();
  const clamp = effects.find((effect) => effect.deps.includes(myData));
  expect(clamp).toBeDefined();
  clamp!.callback();
  expect(states[0]).toBe(2);

  tab = "";
  myData = undefined;
  render();
  for (const effect of effects) effect.callback();
  let leavingRequests = 0;
  let firstPageRequests = 0;
  const firstKey = ["recent-trade-ads", "viewer", null, 1];
  client.setQueryData(mainKey, { ...original, items: [] });
  client.setQueryData(firstKey, { ...original, items: [], page: 1 });
  const leaving = new QueryObserver(client, {
    queryKey: mainKey,
    staleTime: Infinity,
    queryFn: async () => {
      leavingRequests++;
      return original;
    },
  });
  const first = new QueryObserver(client, {
    queryKey: firstKey,
    staleTime: Infinity,
    queryFn: async () => {
      firstPageRequests++;
      return { ...original, page: 1 };
    },
  });
  const stopLeaving = leaving.subscribe(() => {});
  const stopFirst = first.subscribe(() => {});
  listeners.get("realtimeTrades")!({ detail: { action: "refresh_trades" } });
  await flush();
  expect(leavingRequests).toBe(0);
  expect(firstPageRequests).toBe(1);
  expect(replacements.at(-1)).toBe("/trading");
  stopLeaving();
  stopFirst();
  client.clear();
});
