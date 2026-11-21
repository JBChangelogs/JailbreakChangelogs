import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import * as constants from "./constants";
import type SearchableInventoryListSection from "./SearchableInventoryListSection";

type Node = { props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("missing lists page every result, search beyond the current page, and clamp after data shrinks", () => {
  const state: unknown[] = [];
  let cursor = 0;
  const exports = {} as { default: typeof SearchableInventoryListSection };
  const jsx = (_type: unknown, props: Node["props"]) => ({ props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./SearchableInventoryListSection.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            memo: (component: unknown) => component,
            useMemo: (calculate: () => unknown) => calculate(),
            useDeferredValue: (value: unknown) => value,
            useRef: () => ({ current: null }),
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in state)) state[index] = initial;
              return [
                state[index],
                (value: unknown) => {
                  state[index] = value;
                },
              ];
            },
          };
        if (name.endsWith("/constants")) return constants;
        if (name.endsWith("/itemSearch")) return { matchesTextSearch };
        if (name.endsWith("/categoryIcons"))
          return {
            getCategoryColor: () => "blue",
            getCategoryIcon: () => null,
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const items = Array.from({ length: 123 }, (_, index) => ({
    id: index + 1,
    name: `Item${index + 1}`,
    type: index % 2 ? "Rim" : "Vehicle",
  }));
  const render = (list = items) => {
    cursor = 0;
    return nodes(
      exports.default({
        title: "Missing",
        items: list,
        searchPlaceholder: "Search missing",
        filterAriaLabel: "Filter types",
        clearAriaLabel: "Clear search",
        emptyMessage: "Empty",
        noResultsMessage: "No matches",
      }),
    );
  };
  let tree = render();
  const links = () =>
    tree
      .filter((node) => typeof node.props.href === "string")
      .map((node) => node.props.href);
  const pagination = () =>
    tree.find(
      (node) =>
        typeof node.props.onChange === "function" && "count" in node.props,
    )!.props;
  const search = (value: string) => {
    const input = tree.find(
      (node) => node.props.placeholder === "Search missing",
    )!;
    (input.props.onChange as (event: object) => void)({ target: { value } });
    tree = render();
  };
  expect(links()).toHaveLength(50);
  expect(links()[0]).toBe("/item/Vehicle/Item1");
  expect(pagination().count).toBe(3);
  (pagination().onChange as (event: object, value: number) => void)({}, 3);
  tree = render();
  expect(links()).toHaveLength(23);
  expect(links().at(-1)).toBe("/item/Vehicle/Item123");
  expect(tree.find((node) => "start" in node.props)?.props.start).toBe(101);
  search("Item122");
  expect(links()).toContain("/item/Rim/Item122");
  expect(tree.find((node) => "start" in node.props)?.props.start).toBe(1);
  search("");
  expect(pagination().page).toBe(1);
  const typeControl = tree.find((node) => "onValueChange" in node.props)!;
  (typeControl.props.onValueChange as (value: string) => void)("Rim");
  tree = render();
  expect(pagination().count).toBe(2);
  expect(links().every((href) => String(href).startsWith("/item/Rim/"))).toBe(
    true,
  );
  (pagination().onChange as (event: object, value: number) => void)({}, 2);
  tree = render(items.slice(0, 7));
  expect(links()).toHaveLength(3);
  expect(tree.some((node) => "count" in node.props)).toBe(false);
  expect(tree.find((node) => "start" in node.props)?.props.start).toBe(1);
});
