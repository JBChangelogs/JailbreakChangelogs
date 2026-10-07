import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BrowseItemFilters } from "./BrowseItemFilters";
import { filterByTypes } from "@/utils/trading/values";
import type { TradeItem } from "@/types/trading";

test("browse filters keep demand/trend collapsed and the shared range visible", () => {
  const markup = renderToStaticMarkup(
    <BrowseItemFilters
      filters={["favorites"]}
      minValue={1_000_000}
      maxValue={5_000_000}
      onToggle={() => {}}
      onClear={() => {}}
      onRangeChange={() => {}}
    />,
  );
  for (const label of [
    "My Favorites",
    "Limited",
    "Seasonal",
    "Demand (clean)",
    "Trend",
    "Value Range",
    "Minimum",
    "Maximum",
    "Clear filters",
  ])
    expect(markup).toContain(label);
  expect(markup).toContain('aria-expanded="false"');
  expect(markup).toContain('hidden=""');
  expect(markup).toContain('aria-pressed="true"');
  const selectedButton = markup.match(
    /<button\b[^>]*aria-pressed="true"[^>]*>/,
  )?.[0];
  expect(selectedButton).toContain("hover:bg-button-info-hover!");
  expect(selectedButton).toContain("active:bg-button-info-active!");
  expect(selectedButton).not.toContain("hover:bg-button-secondary-hover!");
  expect(markup).not.toContain("Untradable");
  expect(markup).toContain('</fieldset></div><div class="w-full">');
  expect(markup.match(/role="slider"/g)).toHaveLength(2);
  expect(markup).toContain('value="1,000,000"');
  expect(markup).toContain('value="5,000,000"');
});

test("inventory-shaped items OR status tags and combine favorites, category, demand and trend", () => {
  const base: TradeItem = {
    id: 1,
    name: "Torpedo",
    type: "Vehicle",
    cash_value: "30m",
    duped_value: "20m",
    is_limited: 1,
    season: 1,
    level: "10",
    tradable: 1,
    demand: "High",
    trend: "Rising",
  };
  const items = [
    base,
    { ...base, id: 2, demand: "Low" },
    { ...base, id: 3, type: "Rim" },
    { ...base, id: 4, trend: "Dropping" },
    { ...base, id: 5, is_limited: 0 },
    { ...base, id: 6 },
  ];
  const filtered = filterByTypes(
    items,
    [
      "favorites",
      "name-vehicles",
      "name-limited-items",
      "name-seasonal-items",
      "demand-high",
      "trend-rising",
    ],
    items.slice(0, 5).map((item) => ({ item_id: String(item.id) })),
  );
  expect(filtered.map((item) => item.id)).toEqual([1, 5]);
});
