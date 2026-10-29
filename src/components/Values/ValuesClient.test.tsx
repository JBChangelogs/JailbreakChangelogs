import { expect, test } from "bun:test";
import {
  InfiniteQueryObserver,
  QueryClient,
  type InfiniteData,
  type InfiniteQueryObserverOptions,
} from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type ValuesClient from "./ValuesClient";
import type ValuesItemsGrid from "./ValuesItemsGrid";
import type { FavoriteItem, FilterSort, Item } from "@/types";
import type { ItemsPage, ItemsPageOptions } from "@/utils/api/api";
import { filterFavoriteItems } from "@/utils/items/favorites";
import { filterOptions, getServerFilters } from "./valuesFilterOptions";

type Page = ItemsPage<Item>;
type Node = { type: unknown; props: Record<string, unknown> };

function harness(startPage = 1) {
  const client = new QueryClient();
  let options!: InfiniteQueryObserverOptions<Page, Error, InfiniteData<Page>>;
  let result: unknown = {};
  let search = "";
  let failNext = false;
  let stateIndex = 0;
  const states: unknown[] = [];
  const requests: Array<{
    page: number;
    query?: string;
    options: ItemsPageOptions;
  }> = [];
  const item = (id: number) =>
    ({ id, name: `Item ${id}`, type: "Vehicle", cash_value: "1m" }) as Item;
  const favorites: FavoriteItem[] = Array.from({ length: 110 }, (_, i) => ({
    created_at: 0,
    item: item(i),
  }));
  const request = async (
    page: number,
    _signal: AbortSignal,
    options: ItemsPageOptions,
    query?: string,
  ): Promise<Page> => {
    requests.push({ page, options, query });
    if (failNext && page === startPage + 1) throw new Error("Offline");
    return {
      items: [item(page), item(page + 1)],
      page,
      size: 2,
      total: 6,
      total_pages: startPage + 1,
    };
  };
  const gridType = () => {};
  const exports = {} as { default: typeof ValuesClient };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ValuesClient.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const i = stateIndex++;
              if (!(i in states)) states[i] = initial;
              return [
                states[i],
                (value: unknown) => {
                  states[i] =
                    typeof value === "function" ? value(states[i]) : value;
                },
              ];
            },
            useRef: (initial: unknown) => ({ current: initial }),
            useEffect: () => {},
            useMemo: (fn: () => unknown) => fn(),
            useCallback: (fn: unknown) => fn,
          };
        if (name === "react/jsx-runtime")
          return {
            jsx: (type: unknown, props: unknown) => ({ type, props }),
            jsxs: (type: unknown, props: unknown) => ({ type, props }),
          };
        if (name === "next/navigation")
          return {
            useSearchParams: () => new URLSearchParams({ query: search }),
          };
        if (name === "nuqs")
          return {
            useQueryStates: () => [{ page: startPage }, () => {}],
            parseAsInteger: { withDefault: () => {} },
            parseAsString: { withDefault: () => {} },
          };
        if (name === "@tanstack/react-query")
          return {
            useQuery: () => ({}),
            useQueryClient: () => client,
            useInfiniteQuery: (value: typeof options) => {
              options = value;
              return result;
            },
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({ user: { id: "viewer" } }),
            useIsAuthenticated: () => true,
          };
        if (name === "@/hooks/useUserFavorites")
          return { useUserFavorites: () => ({ data: favorites }) };
        if (name === "@/utils/items/favorites") return { filterFavoriteItems };
        if (name === "@/utils/api/api")
          return {
            ItemSearchQueryTooShortError: Error,
            fetchItemsClientPage: request,
            searchItemsClientPage: (
              query: string,
              page: number,
              signal: AbortSignal,
              options: ItemsPageOptions,
            ) => request(page, signal, options, query),
          };
        if (name === "@/hooks/useValueSortState")
          return { useValueSortState: () => ({ valueSort: "cash-desc" }) };
        if (name === "@/hooks/useValuesFilterMode")
          return { useValuesFilterMode: () => ({ filterMode: "multiple" }) };
        if (name === "@/hooks/useValuesRangePreference")
          return {
            useValuesRangePreference: () => ({
              appliedMinValue: 0,
              appliedMaxValue: 50_000_000,
            }),
          };
        if (name === "@/hooks/useSearchTracking")
          return { useSearchTracking: () => {} };
        if (name === "@/hooks/useItemSortGroups")
          return { useItemSortGroups: () => [] };
        if (name === "./valuesFilterOptions")
          return { filterOptions, getServerFilters };
        if (name === "./ValuesItemsGrid") return { default: gridType };
        return {};
      },
    },
  );
  function findGrid(
    node: Node,
  ): Parameters<typeof ValuesItemsGrid>[0] | undefined {
    if (node.type === gridType)
      return node.props as unknown as Parameters<typeof ValuesItemsGrid>[0];
    const children = node.props?.children;
    for (const child of Array.isArray(children)
      ? children.flat(Infinity)
      : [children]) {
      if (child && typeof child === "object") {
        const found = findGrid(child as Node);
        if (found) return found;
      }
    }
  }
  return {
    client,
    requests,
    get options() {
      return options;
    },
    setResult(value: unknown) {
      result = value;
    },
    setSearch(value: string) {
      search = value;
    },
    setFailNext(value: boolean) {
      failNext = value;
    },
    setFilters(value: FilterSort[]) {
      states[2] = value;
    },
    render() {
      stateIndex = 0;
      return findGrid(exports.default() as unknown as Node)!;
    },
  };
}

test("values append pages, preserve cards on failure, retry, deduplicate and reuse cached pages", async () => {
  const h = harness(3);
  h.render();
  const observer = new InfiniteQueryObserver(h.client, {
    ...h.options,
    enabled: false,
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await observer.refetch();
    h.setResult(observer.getCurrentResult());
    expect(h.render().items.map((item) => item.id)).toEqual([3, 4]);
    h.setResult({ ...observer.getCurrentResult(), isFetching: true });
    h.render().onLoadMore();
    expect(h.requests).toHaveLength(1);
    h.setResult(observer.getCurrentResult());
    h.setFailNext(true);
    await observer.fetchNextPage();
    h.setResult(observer.getCurrentResult());
    expect(h.render().loadMoreError).toBe(true);
    expect(h.render().items.map((item) => item.id)).toEqual([3, 4]);
    h.setFailNext(false);
    h.render().onLoadMore();
    await observer.fetchNextPage({ cancelRefetch: false });
    h.setResult(observer.getCurrentResult());
    expect(h.render().items.map((item) => item.id)).toEqual([3, 4, 5]);
    expect(h.render().hasMore).toBe(false);
    expect(h.requests.map((request) => request.page)).toEqual([3, 4, 4]);
    const returned = new InfiniteQueryObserver(h.client, h.options);
    expect(returned.getCurrentResult().data?.pages).toHaveLength(2);
    h.setSearch("Torpedo");
    h.render();
    expect(h.client.getQueryData(h.options.queryKey)).toBeUndefined();
    await h.client.fetchInfiniteQuery(h.options);
    expect(h.requests.at(-1)?.query).toBe("Torpedo");
    expect(h.requests.at(-1)?.options.sort).toBe("cash-desc");
  } finally {
    unsubscribe();
    h.client.clear();
  }
});

test("favorites reveal batches locally and reset the visible batch when filters change", () => {
  const h = harness();
  try {
    h.setFilters(["favorites"]);
    expect(h.render().items).toHaveLength(32);
    expect(h.options.enabled).toBe(false);
    h.render().onLoadMore();
    expect(h.render().items).toHaveLength(64);
    h.render().onLoadMore();
    h.render().onLoadMore();
    expect(h.render().items).toHaveLength(110);
    expect(h.render().hasMore).toBe(false);
    h.setFilters(["favorites", "name-vehicles"]);
    expect(h.render().items).toHaveLength(32);
    expect(h.requests).toHaveLength(0);
  } finally {
    h.client.clear();
  }
});
