import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { getSuggestionFeedRequest } from "@/utils/api/suggestionFeed";
import type { useSuggestionsFeed } from "./useSuggestionsFeed";

test("feed and manual refresh send all filters and retain backend totals", async () => {
  const requests: URL[] = [];
  const keys: unknown[] = [];
  const data = {
    items: [{ id: 12 }],
    page: 2,
    size: 24,
    total: 50,
    total_pages: 3,
  };
  type Query = {
    queryKey: unknown;
    queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  };
  let activeQuery: Query;
  const exports = {} as { useSuggestionsFeed: typeof useSuggestionsFeed };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useSuggestionsFeed.ts", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      fetch: async (url: string) => {
        requests.push(new URL(url));
        return { ok: true, json: async () => data };
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useCallback: (fn: unknown) => fn,
            useEffect: () => {},
            useMemo: (fn: () => unknown) => fn(),
            useRef: (value: unknown) => ({ current: value }),
            useState: (value: unknown) => [value, () => {}],
          };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: Query) => {
              activeQuery = options;
              keys.push(options.queryKey);
              return { data, isPending: false };
            },
            useQueryClient: () => ({
              invalidateQueries: async () => {},
              fetchQuery: async (options: Query) => {
                keys.push(options.queryKey);
                return options.queryFn({
                  signal: new AbortController().signal,
                });
              },
            }),
          };
        if (name === "@/utils/api/suggestionFeed")
          return { getSuggestionFeedRequest };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example.com" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, endpoint: string) => ({
              url: base + endpoint,
              headers: {},
            }),
          };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        return {};
      },
    },
  );
  const feed = exports.useSuggestionsFeed({
    urlQuery: "Torpedo",
    sort: "upvotes",
    page: 2,
    typeFilter: "Vehicle",
    fieldFilter: ["trend", "demand"],
  });
  expect(feed.total).toBe(50);
  expect(feed.totalPages).toBe(3);
  expect(feed.suggestions.map((suggestion) => suggestion.id)).toEqual([12]);
  await activeQuery!.queryFn({ signal: new AbortController().signal });
  await feed.fetchSuggestions(1);
  expect(requests.map((url) => Object.fromEntries(url.searchParams))).toEqual([
    {
      query: "Torpedo",
      sort: "upvotes",
      page: "2",
      type: "Vehicle",
      field: "demand,trend",
    },
    {
      query: "Torpedo",
      sort: "upvotes",
      page: "1",
      type: "Vehicle",
      field: "demand,trend",
    },
  ]);
  expect(keys).toEqual([
    [
      "value-suggestions-feed",
      "Torpedo",
      "upvotes",
      2,
      "Vehicle",
      "demand,trend",
    ],
    [
      "value-suggestions-feed",
      "Torpedo",
      "upvotes",
      1,
      "Vehicle",
      "demand,trend",
    ],
  ]);
});
