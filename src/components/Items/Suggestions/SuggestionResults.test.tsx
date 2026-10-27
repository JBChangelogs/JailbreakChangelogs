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
  ).toContain("No suggestions for Duped Demand.");
  expect(
    tree.some(
      (node) =>
        node.type === "p" &&
        Array.isArray(node.props.children) &&
        node.props.children.includes("Most Downvotes"),
    ),
  ).toBe(true);
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
  ).toContain("No Vehicle suggestions for Demand or Trend matching “Torpedo”.");
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
