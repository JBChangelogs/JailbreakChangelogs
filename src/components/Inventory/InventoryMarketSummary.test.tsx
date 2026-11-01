import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { CatalogValues } from "@/hooks/usePartialItems";
import InventoryMarketSummary from "./InventoryMarketSummary";

test("inventory market summary shows current values and the catalog demand and trend badges", () => {
  const data: CatalogValues = {
    id: 202,
    cash_value: "28m",
    duped_value: "14m",
    demand: "High",
    trend: "Rising",
    is_limited: 1,
    is_seasonal: 0,
    tradable: 1,
    season: null,
    level: null,
  };
  const html = renderToStaticMarkup(<InventoryMarketSummary data={data} />);
  expect(html).not.toContain("Current market");
  expect(html).toContain("bg-secondary-bg");
  expect(html).toContain("Clean value");
  expect(html).toContain("Duped value");
  expect(html).toContain("28m");
  expect(html).toContain("14m");
  expect(html).toContain("28,000,000");
  expect(html).toContain("bg-demand-high");
  expect(html).toContain("High");
  expect(html).toContain("bg-trend-rising");
  expect(html).toContain("Rising");
});

test("unavailable market data stays unknown rather than displaying zero values", () => {
  const html = renderToStaticMarkup(<InventoryMarketSummary />);
  expect(html).toContain("N/A");
  expect(html).toContain("Unknown");
  expect(html).not.toContain(">0<");
});
