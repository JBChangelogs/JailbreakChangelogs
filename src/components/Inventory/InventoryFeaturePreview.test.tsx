import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { InventoryData, InventoryItem } from "@/app/inventories/types";
import InventoryFeaturePreview from "./InventoryFeaturePreview";

test("preview uses breakdown collection rules and never shows loading data as zero completion", () => {
  const ownedItem: InventoryItem = {
    item_id: 1,
    id: "owned",
    title: "Owned vehicle",
    categoryTitle: "Vehicle",
    info: [],
    history: [],
    isOriginalOwner: true,
    is_duplicated: false,
    tradePopularMetric: null,
    level: null,
    timesTraded: 0,
    uniqueCirculation: 1,
    season: null,
    scan_id: "scan",
  };
  const inventory: InventoryData = {
    user_id: "123",
    data: [ownedItem],
    duplicates: [{ ...ownedItem, item_id: 2, is_duplicated: true }],
    item_count: 1,
    level: 1,
    money: 0,
    xp: 0,
    gamepasses: [],
    has_season_pass: false,
    job_id: "job",
    scan_count: 1,
    scan_id: "scan",
    created_at: 0,
    updated_at: 0,
  };
  const client = new QueryClient();
  const snapshot = {
    snapshot_time: 1,
    networth: 100,
    inventory_count: 1,
    inventory_value: 100,
    percentages: { Vehicle: 70, Rim: 30 },
  };
  const tabs = {
    trades: 1,
    breakdown: 2,
    copies: 3,
    dupes: 4,
    graphs: 5,
    comments: 6,
  };
  const render = (
    networthData = [snapshot],
    availableTabs: Record<keyof typeof tabs, number | null> = tabs,
    isOwnInventory = false,
  ) =>
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <InventoryFeaturePreview
          networthData={networthData}
          inventoryData={inventory}
          isOwnInventory={isOwnInventory}
          ownerName="Example User"
          itemsData={[]}
          tabs={availableTabs}
          onExplore={() => {}}
        />
      </QueryClientProvider>,
    );

  const loading = render();
  expect(loading).toContain("Loading collection progress");
  expect(loading).not.toContain("% complete");
  client.setQueryData(
    ["items-partial", "name,type"],
    [
      { id: 1, name: "Owned vehicle", type: "Vehicle" },
      { id: 2, name: "Duped vehicle", type: "Vehicle" },
      { id: 903, name: "Unverifiable item", type: "Rim" },
      { id: 4, name: "Missing rim", type: "Rim" },
    ],
  );
  const html = render();
  expect(html).toContain("Vehicle 70.00%");
  expect(html).toContain("Rim 30.00%");
  expect(html).toContain("75.00% complete");
  expect(html).toContain("1 item missing");
  expect(html).toContain("1 unverifiable item assumed owned");
  expect(html).toContain("View items");
  expect(html).toContain('value="3" max="4"');
  expect(html).toContain("Explore breakdown");
  expect(html).toContain("View features");
  expect(html).toContain('aria-expanded="false"');
  expect(html).toMatch(/aria-controls="([^"]+)"/);
  expect(html).toContain("hidden sm:block");
  expect(html).toContain("Explore Example User’s inventory");
  expect(html).toContain("1 item flagged as duplicated.");
  expect(html).toContain("Networth across 1 recorded snapshot.");
  const ownInventory = render([snapshot], tabs, true);
  expect(ownInventory).toContain("Explore your inventory");
  expect(ownInventory).toContain("Your networth across 1 recorded snapshot.");
  for (const title of [
    "Trade History",
    "Multiple Copies",
    "Duplicate Items",
    "Graphs",
    "Comments",
  ]) {
    expect(html).toContain(title);
  }
  const withoutBreakdown = render([], {
    ...tabs,
    breakdown: null,
    copies: null,
    dupes: null,
  });
  expect(withoutBreakdown).toContain("Trade History");
  expect(withoutBreakdown).toContain('data-inventory-tab="5"');
  expect(withoutBreakdown).toContain("Comments");
  expect(withoutBreakdown).not.toContain("Multiple Copies");
  expect(withoutBreakdown).not.toContain("Duplicate Items");
  expect(withoutBreakdown).not.toContain("Explore breakdown");
  expect(withoutBreakdown).toContain("Track networth and cash over time.");
  expect(
    render([], {
      trades: null,
      breakdown: null,
      copies: null,
      dupes: null,
      graphs: null,
      comments: null,
    }),
  ).toBe("");
  client.clear();
});
