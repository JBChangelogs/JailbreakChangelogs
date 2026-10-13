import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import * as constants from "@/components/Inventory/Breakdown/constants";
import type { useInventoryBreakdownStats } from "./useInventoryBreakdownStats";

test("Hyperchrome modes update completion and missing levels without changing inventory, value or OG ownership", () => {
  let countLowerLevels = true;
  const exports = {} as {
    useInventoryBreakdownStats: typeof useInventoryBreakdownStats;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useInventoryBreakdownStats.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return { useMemo: (calculate: () => unknown) => calculate() };
        if (name === "@/hooks/useHyperchromeCollectionMode")
          return {
            useHyperchromeCollectionMode: () => ({
              countLowerLevels,
              setCountLowerLevels: () => {},
            }),
          };
        if (name === "@/utils/items/categoryIcons")
          return { getCategoryColor: () => "blue" };
        if (name === "@/components/Inventory/Breakdown/constants")
          return constants;
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const colors = [
    "Blue",
    "Diamond",
    "Green",
    "Orange",
    "Pink",
    "Purple",
    "Red",
    "Yellow",
  ];
  const catalog = colors.flatMap((color, index) =>
    Array.from({ length: 5 }, (_, level) => ({
      id: 547 + index * 5 + level,
      name: `Hyper${color} Level ${level + 1}`,
      type: "HyperChrome",
    })),
  );
  catalog.push(
    { id: 587, name: "HyperShift", type: "HyperChrome" },
    { id: 713, name: "HyperShift Level 4", type: "HyperChrome" },
  );
  type Args = Parameters<typeof useInventoryBreakdownStats>;
  const inventory = {
    data: [
      { item_id: 549, isOriginalOwner: true, info: [] },
      { item_id: 547, isOriginalOwner: false, info: [] },
    ],
    duplicates: [
      {
        item_id: 578,
        categoryTitle: "HyperChrome",
        info: [{ title: "Duped Value", value: "100" }],
      },
      { item_id: 549, categoryTitle: "HyperChrome", info: [] },
    ],
  } as unknown as Args[2];
  const snapshot = [
    {
      snapshot_time: 1,
      networth: 1000,
      inventory_value: 900,
      inventory_count: 2,
      duplicates_count: 2,
      percentages: { HyperChrome: 100 },
    },
  ] as Args[0];
  const before = JSON.stringify(inventory);
  const stats = () =>
    exports.useInventoryBreakdownStats(snapshot, [], inventory, catalog);
  const backendSnapshot = [
    {
      snapshot_time: 1791927781,
      networth: 559855443,
      inventory_value: 547239311,
      inventory_count: 1275,
      duplicates_count: 1,
      duplicates_value: 12000000,
      duplicates_percentages: { Rim: 100 },
    },
  ];
  const spinnerInventory = {
    ...inventory,
    duplicates: [
      {
        ...inventory.duplicates![0],
        item_id: 90,
        categoryTitle: "Rim",
        info: [],
      },
    ],
  };
  const spinner = exports.useInventoryBreakdownStats(
    backendSnapshot,
    [],
    spinnerInventory,
    catalog,
  );
  expect(spinner.duplicatesValue).toBe(12000000);
  expect(spinner.duplicateCategoryValues.Rim).toBe(12000000);
  expect(spinner.duplicatesChartData[0].amount).toBe(12000000);
  const mixed = exports.useInventoryBreakdownStats(
    [
      {
        ...backendSnapshot[0],
        duplicates_percentages: { Rim: 75, Vehicle: 25 },
      },
    ],
    [],
    spinnerInventory,
    catalog,
  );
  expect(mixed.duplicateCategoryValues).toEqual({
    Rim: 9000000,
    Vehicle: 3000000,
  });
  expect(mixed.duplicatesValue).toBe(12000000);
  const zero = exports.useInventoryBreakdownStats(
    [{ ...backendSnapshot[0], duplicates_value: 0 }],
    [],
    inventory,
    catalog,
  );
  expect(zero.duplicatesValue).toBe(0);
  expect(zero.duplicateCategoryValues.Rim).toBe(0);
  const combined = stats();
  expect(combined.creditedHyperchromeLevels).toBe(2);
  expect(combined.overallProgress).toEqual({
    total: 42,
    owned: 7,
    missingCount: 35,
    percentage: (7 / 42) * 100,
  });
  expect(combined.missingItemsAll.some((item) => item.id === 548)).toBe(false);
  expect(combined.missingItemsAll.some((item) => item.id === 550)).toBe(true);
  expect(combined.missingItemsAll.some((item) => item.id === 551)).toBe(true);
  expect(combined.missingItemsAll.some((item) => item.id === 552)).toBe(true);
  expect(combined.missingItemsAll.some((item) => item.id === 577)).toBe(false);
  expect(combined.ogMissingItemsAll.some((item) => item.id === 548)).toBe(true);
  expect(combined.ogOwnedProgress.ogOwned).toBe(3);
  expect(combined.typeProgress[0].owned).toBe(7);
  expect(combined.collectionChartData[0].owned).toBe(7);
  countLowerLevels = false;
  const separate = stats();
  expect(separate.creditedHyperchromeLevels).toBe(0);
  expect(separate.overallProgress.owned).toBe(5);
  expect(separate.overallProgress.missingCount).toBe(37);
  expect(separate.missingItemsAll.some((item) => item.id === 548)).toBe(true);
  expect(separate.missingItemsAll.some((item) => item.id === 577)).toBe(true);
  expect(separate.ogOwnedProgress).toEqual(combined.ogOwnedProgress);
  expect(separate.ogMissingItemsAll).toEqual(combined.ogMissingItemsAll);
  expect(separate.ogChartData).toEqual(combined.ogChartData);
  for (const result of [combined, separate]) {
    expect(result.networth).toBe(1000);
    expect(result.totalItems).toBe(4);
    expect(result.duplicatesValue).toBe(100);
    expect(result.unverifiableCount).toBe(2);
  }
  expect(JSON.stringify(inventory)).toBe(before);
  countLowerLevels = true;
  inventory.data.push({
    ...inventory.data[0],
    item_id: 551,
    isOriginalOwner: false,
    info: [],
  });
  expect(stats().overallProgress.owned).toBe(9);
  expect(
    stats().missingItemsAll.some((item) => item.name.startsWith("HyperBlue")),
  ).toBe(false);
  inventory.data = [547, 551].map((item_id) => ({
    ...inventory.data[0],
    item_id,
    isOriginalOwner: true,
    info: [],
  }));
  const multipleOgs = stats();
  expect(multipleOgs.ogOwnedProgress.ogOwned).toBe(4);
  expect(multipleOgs.ogMissingItemsAll.some((item) => item.id === 547)).toBe(
    false,
  );
  expect(multipleOgs.ogMissingItemsAll.some((item) => item.id === 551)).toBe(
    false,
  );
  expect(multipleOgs.ogMissingItemsAll.some((item) => item.id === 548)).toBe(
    true,
  );
  expect(multipleOgs.ogMissingItemsAll.some((item) => item.id === 549)).toBe(
    true,
  );
  countLowerLevels = false;
  expect(stats().ogOwnedProgress).toEqual(multipleOgs.ogOwnedProgress);
});
