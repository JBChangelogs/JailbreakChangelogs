import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import * as constants from "@/components/Inventory/Breakdown/constants";
import type { useInventoryBreakdownStats } from "./useInventoryBreakdownStats";

function loadStats(getCountLowerLevels: () => boolean) {
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
              countLowerLevels: getCountLowerLevels(),
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
  return exports.useInventoryBreakdownStats;
}

test("Hyperchrome modes update completion and missing levels without changing inventory, value or OG ownership", () => {
  let countLowerLevels = true;
  const calculateStats = loadStats(() => countLowerLevels);
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
  const stats = () => calculateStats(snapshot, [], inventory, catalog);
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
  const spinner = calculateStats(
    backendSnapshot,
    [],
    spinnerInventory,
    catalog,
  );
  expect(spinner.duplicatesValue).toBe(12000000);
  expect(spinner.duplicateCategoryValues.Rim).toBe(12000000);
  expect(spinner.duplicatesChartData[0].amount).toBe(12000000);
  const mixed = calculateStats(
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
  const zero = calculateStats(
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
  expect(combined.collectionChartData[0].value).toBe(7);
  expect(
    combined.collectionChartData.reduce((sum, entry) => sum + entry.value, 0),
  ).toBe(combined.overallProgress.owned);
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

test("confirmed legacy items stay visible outside collection and OG completion, whether owned or missing", () => {
  let countLowerLevels = true;
  const calculateStats = loadStats(() => countLowerLevels);
  const legacy = [
    { id: 176, name: "MCL36", type: "Vehicle" },
    { id: 185, name: "Nascar", type: "Vehicle" },
    { id: 187, name: "Nascar Free", type: "Vehicle" },
    { id: 256, name: "Nascar", type: "Tire Sticker" },
    { id: 357, name: "Live 2024", type: "Rim" },
    { id: 708, name: "Nascar Hauler", type: "Texture" },
    { id: 710, name: "MCL36", type: "Tire Sticker" },
    { id: 711, name: "MCL36", type: "Rim" },
    { id: 945, name: "Live 2026", type: "Rim" },
  ];
  const catalog = [
    { id: 1, name: "Obtainable", type: "Vehicle" },
    { id: 186, name: "Nascar 75th", type: "Vehicle" },
    { id: 257, name: "Nascar 75th", type: "Tire Sticker" },
    { id: 903, name: "Unverifiable", type: "Rim" },
    ...legacy,
  ];
  type Args = Parameters<typeof useInventoryBreakdownStats>;
  const inventory = {
    data: [1, 176].map((item_id) => ({
      item_id,
      isOriginalOwner: true,
      info: [],
    })),
    duplicates: [{ item_id: 711, categoryTitle: "Rim", info: [] }],
  } as unknown as Args[2];
  const snapshot = [
    {
      snapshot_time: 1,
      inventory_count: 2,
      duplicates_count: 1,
      inventory_value: 900,
      networth: 1000,
      percentages: { Vehicle: 100 },
    },
  ];
  const before = JSON.stringify(inventory);
  const stats = () => calculateStats(snapshot, [], inventory, catalog);
  expect(constants.UNOBTAINABLE_COLLECTION_ITEM_IDS).toEqual(
    new Set(legacy.map((item) => item.id)),
  );
  for (const mode of [true, false]) {
    countLowerLevels = mode;
    const result = stats();
    expect(result.overallProgress).toEqual({
      total: 4,
      owned: 2,
      missingCount: 2,
      percentage: 50,
    });
    expect(result.ogOwnedProgress.total).toBe(4);
    expect(result.ogOwnedProgress.ogOwned).toBe(2);
    expect(result.missingItemsAll.map((item) => item.id)).toEqual([186, 257]);
    expect(result.ogMissingItemsAll.map((item) => item.id)).toEqual([186, 257]);
    expect(result.unobtainableItemsAll).toHaveLength(9);
    expect(new Set(result.unobtainableItemsAll.map((item) => item.id))).toEqual(
      new Set(legacy.map((item) => item.id)),
    );
    expect(
      result.typeProgress.reduce((sum, entry) => sum + entry.total, 0),
    ).toBe(4);
    expect(
      result.collectionChartData.reduce((sum, entry) => sum + entry.value, 0),
    ).toBe(2);
    expect(result.unverifiableCount).toBe(1);
    expect(result.inventoryValue).toBe(900);
    expect(result.networth).toBe(1000);
    expect(result.totalItems).toBe(3);
  }
  expect(JSON.stringify(inventory)).toBe(before);
  inventory.data.push(
    { ...inventory.data[0], item_id: 186 },
    { ...inventory.data[0], item_id: 257 },
  );
  expect(stats().overallProgress.percentage).toBe(100);
  expect(stats().ogOwnedProgress.percentage).toBe(100);
  expect(stats().missingItemsAll).toEqual([]);
  const legacyOnly = calculateStats([], [], inventory, legacy);
  expect(legacyOnly.overallProgress).toEqual({
    total: 0,
    owned: 0,
    missingCount: 0,
    percentage: 0,
  });
  expect(legacyOnly.unobtainableItemsAll).toHaveLength(9);
  expect(legacyOnly.unverifiableCount).toBe(0);
});
