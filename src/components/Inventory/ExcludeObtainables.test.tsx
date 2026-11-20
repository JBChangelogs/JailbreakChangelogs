import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { ComponentProps } from "react";
import type InventoryFilters from "./InventoryFilters";
import type InventoryItemsGrid from "./InventoryItemsGrid";
import type UserStatsSection from "./UserStatsSection";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import * as seasonUtils from "@/utils/items/season";
import * as currencyUtils from "@/utils/trading/currency";
import { getSnapshotDupedValue } from "@/utils/trading/inventoryValues";

type Element = { type: string; props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

const catalog = [
  { id: 1, is_limited: 1, is_seasonal: 0, season: null, level: null },
  { id: 2, is_limited: 0, is_seasonal: 0, season: 2, level: null },
  { id: 3, is_limited: 0, is_seasonal: 0, season: null, level: "2%" },
  { id: 4, is_limited: 0, is_seasonal: 1, season: null, level: null },
  { id: 5, is_limited: null, is_seasonal: null, season: null, level: null },
].map((item) => ({ ...item, cash_value: "10m", duped_value: "5m" }));
const inventory = {
  user_id: "123",
  money: 100,
  data: [1, 2, 3, 4, 5, 6].map((id) => ({
    id: `clean-${id}`,
    item_id: id,
    title: `Item ${id}`,
    categoryTitle: "Vehicle",
    isOriginalOwner: id !== 2,
    info: [{ title: "Cash Value", value: "10m" }],
  })),
  duplicates: [1, 2, 4].map((id) => ({
    id: `duped-${id}`,
    item_id: id,
    title: `Item ${id}`,
    categoryTitle: "Vehicle",
    isOriginalOwner: false,
    info: [{ title: "Duped Value", value: "5m" }],
  })),
};

function loadComponent(file: string) {
  const exports: { default?: (props: unknown) => Element } = {};
  const state: unknown[] = [];
  let stateIndex = 0;
  const jsx = (type: string, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      process: { env: {} },
      setTimeout: (callback: () => void) => callback(),
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useMemo: (calculate: () => unknown) => calculate(),
            useCallback: (callback: unknown) => callback,
            useState: (initial: unknown) => {
              const index = stateIndex++;
              if (!(index in state)) state[index] = initial;
              return [
                state[index],
                (value: unknown) => {
                  state[index] = value;
                },
              ];
            },
          };
        if (name === "@/hooks/usePartialItems")
          return {
            useCatalogValues: () => ({ data: catalog }),
            usePartialItems: () => ({ data: [] }),
          };
        if (name === "@/hooks/useItemSortGroups")
          return { useItemSortGroups: () => [] };
        if (name === "@/utils/trading/inventoryMerge")
          return {
            mergeInventoryArrayWithMetadata: (items: unknown[]) => items,
          };
        if (name === "@/utils/helpers/itemSearch") return { matchesTextSearch };
        if (name === "@/utils/items/season") return seasonUtils;
        if (name === "@/utils/trading/currency") return currencyUtils;
        if (name === "@/utils/trading/inventoryValues")
          return { getSnapshotDupedValue };
        return { default: name };
      },
    },
  );
  return (props: unknown) => {
    stateIndex = 0;
    return elements(exports.default!(props));
  };
}

test("exclude obtainables updates list and values, and category filters remain exclusive", () => {
  let excludeObtainables = false;
  let showOnlyLimited = false;
  let showOnlySeasonal = false;
  const renderItems = loadComponent("./InventoryItems.tsx");
  const renderStats = loadComponent("./UserStats.tsx");
  const itemsProps = {
    initialData: inventory,
    robloxUsers: {},
    onItemClick: () => {},
    onExcludeObtainablesChange: (value: boolean) => {
      excludeObtainables = value;
    },
    onShowOnlyLimitedChange: (value: boolean) => {
      showOnlyLimited = value;
    },
    onShowOnlySeasonalChange: (value: boolean) => {
      showOnlySeasonal = value;
    },
  };
  const filters = () =>
    renderItems(itemsProps).find((el) => el.type === "./InventoryFilters")!
      .props as unknown as ComponentProps<typeof InventoryFilters>;
  const stats = (ownership = {}) =>
    renderStats({
      initialData: inventory,
      robloxUsers: {},
      itemsData: [],
      showOnlyOriginal: false,
      showOnlyNonOriginal: false,
      showOnlyLimited,
      showOnlySeasonal,
      excludeObtainables,
      ...ownership,
      initialNetworthData: [
        { inventory_value: 60_000_000, duplicates_value: 15_000_000 },
      ],
    }).find((el) => el.type === "./UserStatsSection")!
      .props as unknown as ComponentProps<typeof UserStatsSection>;
  const ids = () => {
    const props = renderItems(itemsProps).find(
      (el) => el.type === "./InventoryItemsGrid",
    )!.props as unknown as ComponentProps<typeof InventoryItemsGrid>;
    return props.filteredItems.map((entry) => entry.item.id);
  };

  expect(stats().activeFilteredStats).toBeNull();
  expect(ids()).toHaveLength(9);
  filters().onLimitedFilterToggle(true);
  filters().onExcludeObtainablesToggle(true);
  expect(showOnlyLimited).toBe(false);
  expect(showOnlySeasonal).toBe(false);
  expect(ids()).toEqual([
    "clean-1",
    "clean-2",
    "clean-3",
    "duped-1",
    "duped-2",
  ]);
  expect(stats().activeFilteredStats).toEqual({
    inventoryValue: 30_000_000,
    dupedValue: 10_000_000,
    networth: 40_000_000,
    itemCount: 5,
    dupedItemCount: 2,
  });
  expect(stats().filterLabel).toBe("Limited or Seasonal");
  const textContent = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(textContent).join("");
    if (value && typeof value === "object" && "props" in value)
      return textContent((value as Element).props.children);
    return typeof value === "string" || typeof value === "number"
      ? String(value)
      : "";
  };
  const summary = () =>
    renderItems(itemsProps)
      .filter((el) => el.type === "p")
      .map(textContent)
      .join(" ");
  expect(summary()).toContain(
    "Limited or Seasonal Clean Inventory Value: $30,000,000",
  );
  expect(summary()).toContain("Limited or Seasonal Duped Value: $10,000,000");
  expect(summary()).toContain("Limited or Seasonal Networth: $40,000,000");
  filters().setSearchTerm("Item 2");
  expect(summary()).toContain(
    "Limited or Seasonal Clean Inventory Value: $10,000,000",
  );
  expect(summary()).toContain("Limited or Seasonal Duped Value: $5,000,000");
  expect(summary()).toContain("Limited or Seasonal Networth: $15,000,000");
  filters().setSearchTerm("");
  expect(
    stats({ showOnlyOriginal: true }).activeFilteredStats!.inventoryValue,
  ).toBe(20_000_000);
  expect(
    stats({ showOnlyNonOriginal: true }).activeFilteredStats!.inventoryValue,
  ).toBe(10_000_000);

  filters().onExcludeObtainablesToggle(false);
  expect(stats().activeFilteredStats).toBeNull();
  expect(ids()).toHaveLength(9);
  expect(summary()).toContain("Total Networth: $75,000,100");
  filters().onNonOriginalFilterToggle(true);
  expect(summary()).toContain("Non-OG Networth: $25,000,100");
  filters().onNonOriginalFilterToggle(false);
  for (const toggle of [
    "onLimitedFilterToggle",
    "onSeasonalFilterToggle",
  ] as const) {
    filters().onExcludeObtainablesToggle(true);
    filters()[toggle](true);
    expect(excludeObtainables).toBe(false);
    filters().onExcludeObtainablesToggle(true);
    expect(showOnlyLimited).toBe(false);
    expect(showOnlySeasonal).toBe(false);
  }
  filters().onShowMissingItemsToggle(true);
  expect(excludeObtainables).toBe(false);
});
