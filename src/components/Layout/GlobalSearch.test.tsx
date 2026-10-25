import { expect, test } from "bun:test";
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
            useEffect: () => {},
          };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user: null }) };
        if (name === "@/utils/ui/globalSearch")
          return {
            createGlobalSearchIndex: () => [],
            getGlobalSearchResults: () => results,
            getGlobalUserResults: () => [],
            getGlobalUserQuery: () => null,
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
  expect(search.clicks).toEqual(["#global-search-result-2 a"]);
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
