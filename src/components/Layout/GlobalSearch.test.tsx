import { expect, test } from "bun:test";
import {
  filteredQuery,
  getGlobalCheckQuery,
  getGlobalUserQuery,
  parseSearchFilter,
} from "@/utils/ui/globalSearch";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

type Node = { type: unknown; props: Record<string, unknown> };
type KeyEvent = {
  key: string;
  target: unknown;
  defaultPrevented: boolean;
  nativeEvent: { isComposing: boolean };
  preventDefault: () => void;
};

function setupSearch() {
  const state: unknown[] = [];
  const refs: { current: unknown }[] = [];
  let stateIndex = 0;
  let refIndex = 0;
  let focuses = 0;
  const events: string[] = [];
  const clicks: string[] = [];
  const input = { focus: () => focuses++ };
  const results = [0, 1, 2].map((id) => ({
    group: "Pages",
    href: `/page-${id}`,
    title: `Page ${id}`,
  }));
  const query = { data: [], isPending: false, isError: false };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const exports = {} as { default: (props: { onClose: () => void }) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./GlobalSearch.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      document: { activeElement: input },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = stateIndex++;
              if (!(index in state)) state[index] = initial;
              return [
                state[index],
                (next: unknown) => {
                  state[index] =
                    typeof next === "function" ? next(state[index]) : next;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = refIndex++;
              return (refs[index] ??= { current: initial });
            },
            useMemo: (get: () => unknown) => get(),
            useReducer: () => [0, () => {}],
            useEffect: () => {},
          };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user: null }) };
        if (name === "@/contexts/TwemojiContext")
          return {
            useTwemoji: () => ({
              twemojiEnabled: true,
              setTwemojiEnabled: () => {},
            }),
          };
        if (name === "@/contexts/ThemeContext")
          return {
            useTheme: () => ({ theme: "dark", setTheme: () => {} }),
          };
        if (name === "@/utils/api/omniSearch")
          return { SearchRateLimitError: class extends Error {} };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({ invalidateQueries: () => {} }),
            useQuery: () => ({ data: undefined }),
          };
        if (name === "@/utils/ui/globalSearch")
          return {
            createGlobalSearchIndex: () => [],
            getGlobalSearchResults: (_index: unknown, term: string) =>
              getGlobalUserQuery(term) !== null ? [] : results,
            getOmniSearchResults: () => [],
            splitQueryMatches: (text: string) => [text],
            parseSearchFilter,
            filteredQuery,
            SEARCH_FILTERS: {},
            getGlobalUserQuery,
            getGlobalCheckQuery,
          };
        if (name === "@/utils/analytics/rybbit")
          return { trackEvent: (event: string) => events.push(event) };
        if (name.startsWith("@/hooks/"))
          return new Proxy({}, { get: () => () => query });
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = () => {
    stateIndex = refIndex = 0;
    const root = exports.default({ onClose: () => {} });
    refs[0].current = input;
    refs[2].current = {
      querySelector: (selector: string) => ({
        click: () => clicks.push(selector),
        getAttribute: () => null,
      }),
    };
    return root.props.children as Node;
  };
  return {
    render,
    events,
    clicks,
    input,
    results,
    sources: query,
    setQuery: (value: string) => {
      state[0] = value;
    },
    highlighted: () => state[1],
    focuses: () => focuses,
    key: (
      key: string,
      target: unknown = input,
      composing = false,
      handled = false,
    ) => {
      let prevented = false;
      const event: KeyEvent = {
        key,
        target,
        defaultPrevented: handled,
        nativeEvent: { isComposing: composing },
        preventDefault: () => {
          prevented = true;
        },
      };
      const dialog = render();
      (dialog.props.onKeyDown as (event: KeyEvent) => void)(event);
      return prevented;
    },
  };
}

test("arrows work from dialog controls, wrap, and preserve rapid key repeats", () => {
  const search = setupSearch();
  const dialog = search.render();
  const handler = dialog.props.onKeyDown as (event: KeyEvent) => void;
  const event: KeyEvent = {
    key: "ArrowDown",
    target: {},
    defaultPrevented: false,
    nativeEvent: { isComposing: false },
    preventDefault: () => {},
  };
  handler(event);
  handler(event);
  expect(search.highlighted()).toBe(2);
  expect(search.focuses()).toBe(2);
  expect(search.key("ArrowDown", {})).toBe(true);
  expect(search.highlighted()).toBe(0);
  search.key("ArrowUp", {});
  expect(search.highlighted()).toBe(2);
  search.key("ArrowDown", {}, true);
  search.key("ArrowDown", {}, false, true);
  expect(search.highlighted()).toBe(2);
  expect(search.key("Enter")).toBe(true);
  expect(search.clicks).toEqual(["#global-search-result-2 :is(a, button)"]);
  expect(search.key("Enter", {})).toBe(false);
  expect(search.clicks).toHaveLength(1);
  search.results.length = 0;
  search.key("ArrowDown", {});
  expect(search.highlighted()).toBe(2);
  expect(search.key("Enter")).toBe(false);
});

test("opening the modal records once per mount, including focus effect replay", () => {
  const search = setupSearch();
  const event = { preventDefault: () => {} };
  const onOpen = search.render().props.onOpenAutoFocus as (
    event: object,
  ) => void;
  onOpen(event);
  onOpen(event);
  expect(search.events).toEqual(["Global Search Opened"]);
  expect(search.focuses()).toBe(2);
  const reopened = setupSearch();
  (reopened.render().props.onOpenAutoFocus as (event: object) => void)(event);
  expect(reopened.events).toEqual(["Global Search Opened"]);
});

function textContent(value: unknown): string {
  if (value == null || typeof value === "boolean") return "";
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  if (typeof value === "object")
    return textContent((value as Node).props.children);
  return String(value);
}

test("bare @ shows account guidance even while unrelated catalogs load or fail", () => {
  const search = setupSearch();
  search.setQuery("@ ");
  search.sources.isPending = true;
  search.sources.isError = true;
  const text = textContent(search.render());
  expect(text).toContain("Type a username to search accounts.");
  expect(text).not.toContain("Searching…");
  expect(text).not.toContain("No results found");
  expect(text).not.toContain("Search failed.");
});

test("no matches show guidance only when the active search has completed successfully", () => {
  const search = setupSearch();
  search.setQuery("missing");
  search.results.length = 0;
  expect(textContent(search.render())).toContain("No results found");
  expect(textContent(search.render())).toContain(
    "Try a different name, or @username for users only.",
  );
  search.sources.isPending = true;
  expect(textContent(search.render())).not.toContain("No results found");
  expect(textContent(search.render())).toContain("Searching…");
  search.sources.isPending = false;
  search.sources.isError = true;
  expect(textContent(search.render())).not.toContain("No results found");

  expect(textContent(search.render())).toContain("Search failed.");

  // "@name" goes to the same search, as typed.
  search.setQuery("@missing");
  search.sources.isError = false;
  search.sources.isPending = true;
  expect(textContent(search.render())).toContain("Searching…");
  search.sources.isPending = false;
  expect(textContent(search.render())).toContain("No results found");
});
