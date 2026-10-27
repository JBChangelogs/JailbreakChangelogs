import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { Fragment, isValidElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type ValuesSearchControls from "./ValuesSearchControls";
import type { FilterSort } from "@/types";
import * as filterOptions from "./valuesFilterOptions";

test("grouped filter summaries stay visible, open the panel, and clear only their own group", () => {
  const states: unknown[] = [];
  let stateIndex = 0;
  const cleared: FilterSort[][] = [];
  const exports = {} as { default: typeof ValuesSearchControls };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ValuesSearchControls.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            Fragment,
            useState: (initial: unknown) => {
              const index = stateIndex++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
            useRef: (initial: unknown) => ({ current: initial }),
            useEffect: () => {},
            useMemo: (callback: () => unknown) => callback(),
          };
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name === "./valuesFilterOptions") return filterOptions;
        if (name === "@/hooks/useDebounce")
          return { useDebounce: (value: unknown) => value };
        if (name === "@/contexts/AuthContext")
          return { useIsAuthenticated: () => true };
        if (name === "nextjs-toploader/app") return { useRouter: () => ({}) };
        if (name === "@/hooks/usePartialItems")
          return { usePartialItems: () => ({}) };
        if (name === "./ValuesSearchSuggestions")
          return { getItemSuggestions: () => [] };
        return {};
      },
    },
  );
  const props: Parameters<typeof ValuesSearchControls>[0] = {
    onDebouncedSearchChange: () => {},
    initialSearchTerm: "",
    clearTrigger: 0,
    selectedFilterSorts: [
      "favorites",
      "name-vehicles",
      "demand-average",
      "demand-decent",
      "demand-high",
      "trend-projected",
    ],
    onToggleFilterSort: () => {
      throw new Error("Clearing a group must not toggle other filters");
    },
    onClearFilterSorts: (subset = []) => {
      cleared.push(subset);
      props.selectedFilterSorts = props.selectedFilterSorts.filter(
        (value) => !subset.includes(value),
      );
    },
    filterMode: "single",
    onFilterModeChange: () => {},
    valueSort: "cash-desc",
    setValueSort: () => {},
    valueSortGroups: [],
    rangeValue: [0, 50_000_000],
    setRangeValue: () => {},
    setAppliedMinValue: () => {},
    appliedMaxValue: 50_000_000,
    setAppliedMaxValue: () => {},
    searchSectionRef: { current: null },
    maxValueRange: 50_000_000,
  };
  type NodeProps = {
    children?: ReactNode;
    "aria-label"?: string;
    "aria-expanded"?: boolean;
    onClick?: () => void;
    title?: string;
  };
  function nodes(node: ReactNode): NodeProps[] {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!isValidElement<NodeProps>(node)) return [];
    return [node.props, ...nodes(node.props.children)];
  }
  const render = () => {
    stateIndex = 0;
    return nodes(exports.default(props));
  };
  const summaries = () =>
    render().filter((node) => node["aria-label"]?.startsWith("Edit "));
  const clearGroup = (group: string) =>
    render().find((node) => node["aria-label"] === `Clear ${group} filters`)!
      .onClick!();
  const text = (node: ReactNode): string => {
    if (Array.isArray(node)) return node.map(text).join("");
    if (isValidElement<NodeProps>(node)) return text(node.props.children);
    return typeof node === "string" || typeof node === "number"
      ? String(node)
      : "";
  };
  const panelIsOpen = () =>
    render().some((node) => node.children === "Advanced Filters");
  const toggle = () =>
    render().find(
      (node) =>
        node["aria-expanded"] !== undefined && node.onClick !== undefined,
    )!.onClick!();

  expect(panelIsOpen()).toBe(false);
  expect(summaries()).toHaveLength(2);
  expect(summaries().map((summary) => text(summary.children))).toEqual([
    "Demand: Average, Decent +1",
    "Trend: Projected",
  ]);
  expect(summaries()[0].title).toBe("Demand: Average, Decent, High");
  expect(
    render().some((node) => text(node.children) === "Clear demand filters"),
  ).toBe(true);
  expect(
    render().some((node) => text(node.children) === "Clear trend filters"),
  ).toBe(true);
  summaries()[0].onClick!();
  expect(panelIsOpen()).toBe(true);
  toggle();
  expect(panelIsOpen()).toBe(false);
  expect(summaries()).toHaveLength(2);
  clearGroup("demand");
  expect(cleared).toEqual([["demand-average", "demand-decent", "demand-high"]]);
  expect(props.selectedFilterSorts).toEqual([
    "favorites",
    "name-vehicles",
    "trend-projected",
  ]);
  expect(summaries()).toHaveLength(1);
  expect(panelIsOpen()).toBe(false);
  clearGroup("trend");
  expect(summaries()).toHaveLength(0);
  expect(props.selectedFilterSorts).toEqual(["favorites", "name-vehicles"]);
});
