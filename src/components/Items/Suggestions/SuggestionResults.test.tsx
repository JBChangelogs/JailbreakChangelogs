import { expect, test } from "bun:test";
import { SuggestionResults } from "./SuggestionResults";

type Element = { type: unknown; props: { children?: unknown } };
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Element;
  return [node, ...nodes(node.props?.children)];
}

const noop = () => {};
const base: Parameters<typeof SuggestionResults>[0] = {
  loadingSuggestions: false,
  noSuggestionsFound: true,
  suggestionsError: null,
  filteredSuggestions: [],
  isAuthenticated: true,
  userHasRoblox: true,
  isBanned: false,
  urlQuery: "",
  activeSortLabel: null,
  typeFilter: "All",
  fieldFilter: [],
  hasActiveFilters: false,
  totalPages: 1,
  page: 1,
  pageChanging: false,
  votingIds: new Set(),
  votingTypes: new Map(),
  voteRateLimits: new Map(),
  onLogin: noop,
  onConnectRoblox: noop,
  onOpenForm: noop,
  onRetry: noop,
  onClearAllFilters: noop,
  onPageChange: noop,
  onVote: noop,
  onOpenVoters: noop,
  onOpenReport: noop,
};

test("empty results name both the selected field and sort", () => {
  const tree = nodes(
    SuggestionResults({
      ...base,
      hasActiveFilters: true,
      fieldFilter: ["duped_demand"],
      activeSortLabel: "Most Downvotes",
    }),
  );
  expect(tree.find((node) => node.type === "h3")?.props.children).toBe(
    "No matching suggestions",
  );
  expect(
    tree.filter((node) => node.type === "p").map((node) => node.props.children),
  ).toContain("No suggestions for Duped Demand in Most Downvotes.");
  expect(
    tree.some(
      (node) =>
        typeof node.props.children === "string" &&
        node.props.children.startsWith("Sorted by"),
    ),
  ).toBe(false);
  expect(tree.some((node) => node.props.children === "Clear filters")).toBe(
    true,
  );
});

test("empty results include search, item type and every selected field", () => {
  const tree = nodes(
    SuggestionResults({
      ...base,
      hasActiveFilters: true,
      urlQuery: "Torpedo",
      typeFilter: "Vehicle",
      fieldFilter: ["demand", "trend"],
      activeSortLabel: "Newest First",
    }),
  );
  expect(
    tree.filter((node) => node.type === "p").map((node) => node.props.children),
  ).toContain(
    "No Vehicle suggestions for Demand or Trend matching “Torpedo” in Newest First.",
  );
});

test("unfiltered empty feed keeps the first-suggestion message", () => {
  const tree = nodes(SuggestionResults(base));
  expect(tree.find((node) => node.type === "h3")?.props.children).toBe(
    "No suggestions yet",
  );
  expect(
    tree.some(
      (node) =>
        node.props.children === "Be the first to suggest a value change.",
    ),
  ).toBe(true);
});

test("a sort that empties the list offers another sort, not filters", () => {
  const tree = nodes(
    SuggestionResults({
      ...base,
      hasActiveFilters: true,
      activeSortLabel: "Value Team Suggestions",
    }),
  );
  const text = tree.map((node) => node.props.children);
  expect(text).toContain("No matching suggestions");
  expect(text).toContain("Try another sort to see more suggestions.");
  expect(text).toContain("Show all suggestions");
  expect(text).not.toContain("No suggestions in Value Team Suggestions.");
});
