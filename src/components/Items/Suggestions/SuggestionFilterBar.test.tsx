import { expect, test } from "bun:test";
import { SuggestionFilterBar } from "./SuggestionFilterBar";
import { SuggestionsToolbar } from "./SuggestionsToolbar";
import { filterGroups } from "@/components/Values/valuesFilterOptions";
import {
  DropdownMenuLabel,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

type Element = {
  type: unknown;
  props: { children?: unknown; [key: string]: unknown };
};
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Element;
  return [node, ...nodes(node.props?.children)];
}

const baseProps = {
  searchInputRef: { current: null },
  urlQuery: "",
  isSearchLoading: false,
  hasSearchText: false,
  isSearchHighlighted: false,
  onSearchSubmit: () => {},
  onSearchTextChange: () => {},
  onClearSearch: () => {},
  typeFilter: "All",
  onTypeFilterChange: () => {},
  fieldFilter: [] as string[],
  onFieldFilterChange: (_value: string) => {},
  suggestionFields: ["cash_value", "demand"],
  sortControl: <span>Sort control</span>,
};

test("category menu shares values groups and labels while sending API item types", () => {
  const changed: string[] = [];
  const tree = nodes(
    SuggestionFilterBar({
      ...baseProps,
      typeFilter: "Vehicle",
      onTypeFilterChange: (value) => changed.push(value),
    }),
  );
  expect(
    tree
      .filter((node) => node.type === DropdownMenuLabel)
      .map((node) => node.props.children),
  ).toEqual(["Vehicle", "Other"]);
  expect(
    tree
      .filter((node) => node.type === DropdownMenuRadioItem)
      .map((node) => [node.props.value, node.props.children]),
  ).toEqual([
    ["All", "All Items"],
    ...filterGroups.flatMap((group) =>
      group.options.map((option) => [option.itemType, option.label]),
    ),
  ]);
  expect(
    tree.some(
      (node) => node.type === "span" && node.props.children === "Vehicles",
    ),
  ).toBe(true);
  const menu = tree.find(
    (node) => typeof node.props.onValueChange === "function",
  )!;
  (menu.props.onValueChange as (value: string) => void)("Weapon Skin");
  expect(changed).toEqual(["Weapon Skin"]);
});

test("field chips select and clear a field while leaving search and type controls available", () => {
  const changed: string[] = [];
  const tree = nodes(
    SuggestionFilterBar({
      ...baseProps,
      fieldFilter: ["demand"],
      onFieldFilterChange: (value) => changed.push(value),
    }),
  );
  const chips = tree.filter(
    (node) => typeof node.props?.["aria-pressed"] === "boolean",
  );
  expect(chips.map((node) => node.props.children)).toEqual([
    "All fields",
    "Cash Value",
    "Demand",
  ]);
  expect(chips.map((node) => node.props["aria-pressed"])).toEqual([
    false,
    false,
    true,
  ]);
  (chips[1].props.onClick as () => void)();
  (chips[2].props.onClick as () => void)();
  (chips[0].props.onClick as () => void)();
  expect(changed).toEqual(["cash_value", "demand", "All"]);
  expect(tree.some((node) => node.type === "form")).toBe(true);
  expect(tree.some((node) => node.props?.children === "All Items")).toBe(true);
  expect(tree.some((node) => node.props?.children === "Sort control")).toBe(
    true,
  );
});

test("multiple field chips stay selected during loading with no results", () => {
  const tree = nodes(
    SuggestionFilterBar({
      ...baseProps,
      fieldFilter: ["cash_value", "demand"],
      isSearchLoading: true,
    }),
  );
  const chips = tree.filter(
    (node) => typeof node.props?.["aria-pressed"] === "boolean",
  );
  expect(chips.map((node) => node.props["aria-pressed"])).toEqual([
    false,
    true,
    true,
  ]);
});

test("sort moves into the search row and remains available for empty feeds", () => {
  const props = {
    ...baseProps,
    actions: <span>Actions</span>,
    loadingSuggestions: false,
    total: 2,
    sortGroups: [
      {
        label: "Activity",
        options: [
          { value: "recent", label: "Recent Activity" },
          { value: "value_team", label: "Value Team" },
        ],
      },
    ],
    sort: "recent",
    canSeeVt: false,
    pendingNew: 0,
    pendingTypes: new Set<string>(),
    onSortChange: () => {},
    onRefresh: () => {},
  };
  const populated = nodes(SuggestionsToolbar(props));
  const filterBar = populated.find(
    (node) => node.type === SuggestionFilterBar,
  )!;
  expect(filterBar.props.sortControl).toBeDefined();
  expect(
    populated.filter(
      (node) => node.props?.["aria-label"] === "Sort suggestions",
    ),
  ).toHaveLength(0);
  for (const state of [
    { loadingSuggestions: true, total: 0 },
    { loadingSuggestions: false, total: 0 },
  ]) {
    const tree = nodes(SuggestionsToolbar({ ...props, ...state }));
    const filters = tree.find((node) => node.type === SuggestionFilterBar)!;
    expect(filters).toBeDefined();
    expect(
      nodes(filters.props.sortControl).filter(
        (node) => node.props?.["aria-label"] === "Sort suggestions",
      ),
    ).toHaveLength(1);
    expect(
      tree.filter((node) => node.props?.["aria-label"] === "Sort suggestions"),
    ).toHaveLength(0);
    expect(
      nodes(filters.props.sortControl).some(
        (node) => node.props?.children === "Value Team",
      ),
    ).toBe(false);
  }
});
