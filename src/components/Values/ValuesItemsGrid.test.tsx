import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type ValuesItemsGrid from "./ValuesItemsGrid";
import { getFilterSortsDisplayNames } from "./valuesFilterOptions";
import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";

test("scroll loading pauses during fetches and errors, retries manually, and resets page links on filter changes", () => {
  const effects: Array<() => void | (() => void)> = [];
  const refs: Array<{ current: unknown }> = [];
  let refIndex = 0;
  let intersection!: (entries: Array<{ isIntersecting: boolean }>) => void;
  let observed = 0;
  let disconnected = 0;
  let loaded = 0;
  let retried = 0;
  const pages: number[] = [];
  const button = Symbol("Button");
  const gridAd = Symbol("NitroGridAd");
  const auth = { isLoading: false, user: { premiumtype: 0 } };
  const exports = {} as { default: typeof ValuesItemsGrid };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ValuesItemsGrid.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      IntersectionObserver: class {
        constructor(callback: typeof intersection) {
          intersection = callback;
        }
        observe() {
          observed++;
        }
        disconnect() {
          disconnected++;
        }
      },
      require: (name: string) => {
        if (name === "react")
          return {
            default: { Fragment: "fragment" },
            useMemo: (fn: () => unknown) => fn(),
            useEffect: (fn: () => void) => effects.push(fn),
            useRef: (value: unknown) =>
              refs[refIndex++] ?? (refs[refIndex - 1] = { current: value }),
          };
        if (name === "react/jsx-runtime")
          return {
            jsx: (type: unknown, props: unknown) => ({ type, props }),
            jsxs: (type: unknown, props: unknown) => ({ type, props }),
          };
        if (name === "@tanstack/react-query") return { useQuery: () => ({}) };
        if (name === "nuqs")
          return {
            useQueryState: () => [3, (page: number) => pages.push(page)],
            parseAsInteger: { withDefault: () => {} },
          };
        if (name === "@/hooks/useRailAdSize")
          return { useRailAdSize: () => "none" };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => auth };
        if (name === "@/utils/auth/supporterAccess")
          return { canHideAdsForPremiumType };
        if (name === "@/components/Ads/NitroGridAd") return { default: gridAd };
        if (name === "../ui/button") return { Button: button };
        if (name === "./valuesFilterOptions")
          return { getFilterSortsDisplayNames };
        return {};
      },
    },
  );
  const props: Parameters<typeof ValuesItemsGrid>[0] = {
    items: [],
    favorites: [],
    onFavoriteChange: () => {},
    appliedMinValue: 0,
    appliedMaxValue: 50_000_000,
    MAX_VALUE_RANGE: 50_000_000,
    onResetValueRange: () => {},
    onClearAllFilters: () => {},
    onClearCategoryFilter: () => {},
    selectedFilterSorts: [],
    totalItemsCount: 100,
    hasMore: true,
    isFetching: false,
    loadMoreError: false,
    onLoadMore: () => {
      loaded++;
    },
    onRetry: () => {
      retried++;
    },
    pageSize: 50,
    valueSort: "cash-desc",
    debouncedSearchTerm: "",
  };
  type Node = {
    type: unknown;
    props: {
      children?: unknown;
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
    };
  };
  function nodes(value: unknown): Node[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...nodes(node.props.children)];
  }
  const render = () => {
    refIndex = 0;
    effects.length = 0;
    const tree = exports.default(props);
    refs[1].current = {};
    const cleanups = effects.map((fn) => fn());
    return {
      tree,
      cleanup: () =>
        cleanups.forEach((fn) => {
          if (fn) fn();
        }),
    };
  };
  let view = render();
  expect(pages).toEqual([]);
  expect(observed).toBe(1);
  intersection([{ isIntersecting: false }]);
  expect(loaded).toBe(0);
  intersection([{ isIntersecting: true }]);
  expect(loaded).toBe(1);
  view.cleanup();
  expect(disconnected).toBe(1);

  props.isFetching = true;
  view = render();
  expect(
    nodes(view.tree).some(
      (node) => node.type === button && node.props.children === "Loading more…",
    ),
  ).toBe(false);
  expect(observed).toBe(1);
  props.isFetching = false;
  props.loadMoreError = true;
  view = render();
  expect(observed).toBe(1);
  nodes(view.tree).find(
    (node) => node.type === button && node.props.children === "Retry",
  )!.props.onClick!();
  expect(loaded).toBe(2);

  props.hasMore = false;
  props.loadMoreError = false;
  props.searchErrorMessage = "Could not load items";
  view = render();
  nodes(view.tree).find(
    (node) => node.type === button && node.props.children === "Retry",
  )!.props.onClick!();
  expect(retried).toBe(1);
  expect(observed).toBe(1);
  props.debouncedSearchTerm = "Torpedo";
  render();
  expect(pages).toEqual([1]);

  // Appending pages must not leave padded ad rows for ad-free supporters.
  const adRows = () =>
    nodes(render().tree).filter(
      (node) =>
        node.props.className?.includes("col-span-full") &&
        nodes(node.props.children).some((child) => child.type === gridAd),
    );
  for (const count of [32, 64, 96]) {
    props.items = Array.from({ length: count }, (_, id) => ({
      id,
    })) as typeof props.items;
    for (const tier of [0, 1, 2, 3]) {
      auth.user.premiumtype = tier;
      expect(adRows().length).toBe(
        tier >= 2 ? 0 : 1 + count / 32 + Math.floor(count / 96),
      );
    }
    auth.user.premiumtype = 0;
    auth.isLoading = true;
    expect(adRows()).toEqual([]);
    auth.isLoading = false;
  }
});
