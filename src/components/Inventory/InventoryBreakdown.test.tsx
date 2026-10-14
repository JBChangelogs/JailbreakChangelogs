import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type InventoryBreakdown from "./InventoryBreakdown";

type Element = { props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

test("ownership tabs switch panels and View list reveals collection before scrolling", () => {
  const disclosure = { open: false };
  let progressTab: string | undefined;
  const calls: string[] = [];
  let scroll: unknown;
  let focus: unknown;
  const target = {
    querySelector: (selector: string) =>
      selector === "details"
        ? disclosure
        : {
            focus: (options: unknown) => {
              calls.push("focus");
              focus = options;
            },
          },
    getBoundingClientRect: () => {
      expect(progressTab).toBe("collection");
      expect(disclosure.open).toBe(true);
      calls.push("measure");
      return { top: 300 };
    },
  };
  const exports = {} as { default: typeof InventoryBreakdown };
  const jsx = (_type: unknown, props: Element["props"]) => ({ props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./InventoryBreakdown.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      document: { documentElement: {} },
      getComputedStyle: () => ({ getPropertyValue: () => "60px" }),
      window: {
        scrollY: 200,
        scrollTo: (options: unknown) => {
          calls.push("scroll");
          scroll = options;
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime")
          return { jsx, jsxs: jsx, Fragment: "fragment" };
        if (name === "react")
          return {
            useState: (initial: string) => {
              progressTab ??= initial;
              return [progressTab, (value: string) => (progressTab = value)];
            },
            useRef: (value: unknown) => ({
              current: value === null ? target : value,
            }),
          };
        if (name === "react-dom")
          return { flushSync: (callback: () => void) => callback() };
        if (name === "@/components/ui/tabs")
          return {
            Tabs: "Tabs",
            TabsList: "TabsList",
            TabsTrigger: "TabsTrigger",
            TabsContent: "TabsContent",
          };
        if (name === "@/hooks/usePartialItems")
          return { usePartialItems: () => ({ data: [] }) };
        if (name === "@/hooks/useInventoryBreakdownStats")
          return {
            useInventoryBreakdownStats: () => ({
              latestData: { percentages: {} },
              sortedDuplicateEntries: [],
            }),
          };
        return { default: name };
      },
    },
  );
  const render = () =>
    exports.default({
      networthData: [],
      username: "Example",
      itemsData: [],
      inventoryData: {
        user_id: "123",
        data: [],
        duplicates: [],
        item_count: 0,
        level: 0,
        money: 0,
        xp: 0,
        gamepasses: [],
        has_season_pass: false,
        job_id: "job",
        scan_count: 0,
        scan_id: "scan",
        created_at: 0,
        updated_at: 0,
      },
    });
  let tree = render();
  const panels = () =>
    elements(tree).filter((element) => element.props.forceMount);
  expect(progressTab).toBe("collection");
  expect(
    panels().map((panel) => [panel.props.value, panel.props.hidden]),
  ).toEqual([
    ["collection", false],
    ["og-owned", true],
  ]);
  expect(
    elements(tree)
      .filter((element) => element.props.fullWidth && element.props.value)
      .map((element) => element.props.children),
  ).toEqual(["Collection Progress", "OG Owned"]);
  const tabs = elements(tree).find(
    (element) => typeof element.props.onValueChange === "function",
  )!;
  (tabs.props.onValueChange as (value: string) => void)("og-owned");
  tree = render();
  expect(panels().map((panel) => panel.props.hidden)).toEqual([true, false]);
  const actions = elements(tree).filter(
    (element) => typeof element.props.onViewUnverifiable === "function",
  );
  expect(actions).toHaveLength(2);
  for (const action of actions) {
    progressTab = "og-owned";
    disclosure.open = false;
    calls.length = 0;
    (action.props.onViewUnverifiable as () => void)();
    expect(disclosure.open).toBe(true);
    expect(scroll).toEqual({ top: 428, behavior: "smooth" });
    expect(focus).toEqual({ preventScroll: true });
    expect(calls).toEqual(["measure", "scroll", "focus"]);
  }
});
