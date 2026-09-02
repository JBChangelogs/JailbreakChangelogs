import { useMemo } from "react";
import { getCategoryColor } from "@/utils/items/categoryIcons";
import type { UserNetworthData } from "@/utils/api/api";
import type { ChartConfig } from "@/components/ui/chart";
import type { Item } from "@/types";
import type { InventoryData } from "@/app/inventories/types";
import {
  UNVERIFIABLE_COLLECTION_ITEM_IDS,
  VALUES_TYPE_ORDER_RANK,
} from "@/components/Inventory/Breakdown/constants";

export const useInventoryBreakdownStats = (
  networthData: UserNetworthData[],
  itemsData: Item[],
  inventoryData: InventoryData,
) => {
  // Get the latest networth data
  const latestData =
    networthData && networthData.length > 0 ? networthData[0] : null;

  const categoryValues = useMemo(() => {
    if (!latestData?.percentages || !latestData.inventory_value) return {};

    const nextCategoryValues: Record<string, number> = {};
    const totalInventoryValue = latestData.inventory_value;

    Object.entries(latestData.percentages).forEach(([category, percentage]) => {
      nextCategoryValues[category] = (percentage / 100) * totalInventoryValue;
    });

    return nextCategoryValues;
  }, [latestData]);
  const sortedCategoryEntries = useMemo(
    () =>
      Object.entries(latestData?.percentages || {}).sort(
        ([, a], [, b]) => b - a,
      ),
    [latestData?.percentages],
  );
  const categoryChartData = useMemo(
    () =>
      sortedCategoryEntries.map(([category, percentage]) => ({
        category,
        percentage,
        value: percentage,
        amount: categoryValues[category] ?? 0,
        fill: getCategoryColor(category),
      })),
    [categoryValues, sortedCategoryEntries],
  );
  const categoryChartConfig = {
    percentage: {
      label: "Category Share",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const duplicateCategoryValues = useMemo(() => {
    if (
      itemsData.length === 0 ||
      !inventoryData.duplicates ||
      inventoryData.duplicates.length === 0
    ) {
      return {};
    }

    const parseVal = (val: string | null): number => {
      if (!val || val === "N/A") return 0;
      const cleanVal = val.replace(/,/g, "").toLowerCase();
      const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return 0;
      if (cleanVal.includes("k")) return num * 1000;
      if (cleanVal.includes("m")) return num * 1000000;
      if (cleanVal.includes("b")) return num * 1000000000;
      return num;
    };

    const itemsMap = new Map(
      itemsData.map((item) => [item.id.toString(), item]),
    );
    const nextCategoryValues: Record<string, number> = {};

    inventoryData.duplicates.forEach((invItem) => {
      const item = itemsMap.get(invItem.item_id.toString());
      if (!item) return;

      const val = parseVal(item.duped_value);
      nextCategoryValues[invItem.categoryTitle] =
        (nextCategoryValues[invItem.categoryTitle] || 0) + val;
    });

    return nextCategoryValues;
  }, [inventoryData.duplicates, itemsData]);

  const ownedItemIds = useMemo(() => {
    const ids = new Set<number>();
    inventoryData.data.forEach((invItem) => ids.add(invItem.item_id));
    (inventoryData.duplicates || []).forEach((invItem) =>
      ids.add(invItem.item_id),
    );
    return ids;
  }, [inventoryData.data, inventoryData.duplicates]);

  const ogOwnedItemIds = useMemo(() => {
    const ids = new Set<number>();
    inventoryData.data
      .filter((invItem) => invItem.isOriginalOwner)
      .forEach((invItem) => ids.add(invItem.item_id));
    return ids;
  }, [inventoryData.data]);

  const includeUntradable = true;

  const eligibleItems = useMemo(() => {
    if (includeUntradable) return itemsData;
    return itemsData.filter((item) => Boolean(item.tradable));
  }, [itemsData, includeUntradable]);

  const unverifiableItemsAll = useMemo(() => {
    const unverifiable = eligibleItems
      .filter((item) => UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type?.trim() || "Unknown",
      }));
    unverifiable.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.type.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.type.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });
    return unverifiable;
  }, [eligibleItems]);

  const unverifiableCount = useMemo(() => {
    return eligibleItems.reduce((count, item) => {
      return UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id) ? count + 1 : count;
    }, 0);
  }, [eligibleItems]);

  const effectiveOwnedItemIds = useMemo(() => {
    const ids = new Set<number>(ownedItemIds);
    UNVERIFIABLE_COLLECTION_ITEM_IDS.forEach((id) => ids.add(id));
    return ids;
  }, [ownedItemIds]);

  const effectiveOgOwnedItemIds = useMemo(() => {
    const ids = new Set<number>(ogOwnedItemIds);
    UNVERIFIABLE_COLLECTION_ITEM_IDS.forEach((id) => ids.add(id));
    return ids;
  }, [ogOwnedItemIds]);

  const typeProgress = useMemo(() => {
    const byType = new Map<string, Item[]>();
    eligibleItems.forEach((item) => {
      const type = item.type?.trim() || "Unknown";
      const existing = byType.get(type);
      if (existing) existing.push(item);
      else byType.set(type, [item]);
    });

    const progress = Array.from(byType.entries()).map(([type, typeItems]) => {
      const ownedCount = typeItems.filter((item) => {
        return effectiveOwnedItemIds.has(item.id);
      }).length;
      const ogOwnedCount = typeItems.filter((item) =>
        effectiveOgOwnedItemIds.has(item.id),
      ).length;
      const missing = typeItems
        .filter((item) => {
          if (UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id)) return false;
          return !effectiveOwnedItemIds.has(item.id);
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      const missingCount = typeItems.length - ownedCount;
      const percentage =
        typeItems.length > 0 ? (ownedCount / typeItems.length) * 100 : 0;

      return {
        type,
        total: typeItems.length,
        owned: ownedCount,
        ogOwned: ogOwnedCount,
        missing,
        missingCount,
        percentage,
      };
    });

    progress.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.owned !== a.owned) return b.owned - a.owned;
      if (b.total !== a.total) return b.total - a.total;
      return a.type.localeCompare(b.type);
    });

    return progress;
  }, [effectiveOwnedItemIds, effectiveOgOwnedItemIds, eligibleItems]);

  const overallProgress = useMemo(() => {
    const total = eligibleItems.length;
    const owned = eligibleItems.filter((item) =>
      effectiveOwnedItemIds.has(item.id),
    ).length;
    const missingCount = total - owned;
    const percentage = total > 0 ? (owned / total) * 100 : 0;
    return { total, owned, missingCount, percentage };
  }, [effectiveOwnedItemIds, eligibleItems]);

  const ogOwnedProgress = useMemo(() => {
    const total = eligibleItems.length;
    const ogOwned = eligibleItems.filter((item) =>
      effectiveOgOwnedItemIds.has(item.id),
    ).length;
    const ogMissing = total - ogOwned;
    const percentage = total > 0 ? (ogOwned / total) * 100 : 0;
    return { total, ogOwned, ogMissing, percentage };
  }, [eligibleItems, effectiveOgOwnedItemIds]);

  const missingItemsAll = useMemo(() => {
    const missing = typeProgress.flatMap((progress) =>
      progress.missing.map((item) => ({
        id: item.id,
        name: item.name,
        type: progress.type,
      })),
    );
    missing.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.type.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.type.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });
    return missing;
  }, [typeProgress]);

  const ogMissingItemsAll = useMemo(() => {
    const items = eligibleItems
      .filter(
        (item) =>
          !ogOwnedItemIds.has(item.id) &&
          !UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id),
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type?.trim() || "Unknown",
      }));
    items.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.type.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.type.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [eligibleItems, ogOwnedItemIds]);

  const networth = latestData?.networth ?? 0;
  const inventoryCount = latestData?.inventory_count ?? 0;
  const money = latestData?.money ?? 0;
  const inventoryValue = latestData?.inventory_value;
  const percentages = latestData?.percentages;
  const duplicatesCount = latestData?.duplicates_count ?? 0;

  const clientDuplicatesTotal = Object.values(duplicateCategoryValues).reduce(
    (sum, v) => sum + v,
    0,
  );
  const duplicatesValue =
    clientDuplicatesTotal > 0
      ? clientDuplicatesTotal
      : latestData?.duplicates_value;
  const clientDuplicatesPercentages = useMemo<Record<string, number>>(
    () =>
      clientDuplicatesTotal > 0
        ? Object.fromEntries(
            Object.entries(duplicateCategoryValues).map(([cat, val]) => [
              cat,
              (val / clientDuplicatesTotal) * 100,
            ]),
          )
        : {},
    [clientDuplicatesTotal, duplicateCategoryValues],
  );
  const sortedDuplicateEntries = useMemo(
    () =>
      Object.entries(
        clientDuplicatesTotal > 0
          ? clientDuplicatesPercentages
          : latestData?.duplicates_percentages || {},
      ).sort(([, a], [, b]) => b - a),
    [
      clientDuplicatesPercentages,
      clientDuplicatesTotal,
      latestData?.duplicates_percentages,
    ],
  );
  const duplicatesChartData = useMemo(
    () =>
      sortedDuplicateEntries.map(([category, percentage]) => ({
        category,
        value: percentage,
        amount: duplicateCategoryValues[category] ?? 0,
        fill: getCategoryColor(category),
      })),
    [duplicateCategoryValues, sortedDuplicateEntries],
  );

  // Calculate total items including duplicates
  const totalItems = inventoryCount + duplicatesCount;

  const collectionChartConfig = {
    value: {
      label: "Completion",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const collectionChartData = useMemo(
    () =>
      typeProgress
        .filter((entry) => entry.total > 0)
        .map((entry) => ({
          category: entry.type,
          value: entry.percentage,
          owned: entry.owned,
          total: entry.total,
          missingCount: entry.missingCount,
          percentage: entry.percentage,
          fill: getCategoryColor(entry.type),
        })),
    [typeProgress],
  );

  const ogChartConfig = {
    value: {
      label: "OG Owned",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const ogChartData = useMemo(
    () =>
      typeProgress
        .filter((entry) => entry.ogOwned > 0)
        .map((entry) => ({
          category: entry.type,
          value: entry.ogOwned,
          total: entry.total,
          percentage: entry.total > 0 ? (entry.ogOwned / entry.total) * 100 : 0,
          fill: getCategoryColor(entry.type),
        })),
    [typeProgress],
  );

  return {
    latestData,
    categoryValues,
    sortedCategoryEntries,
    categoryChartData,
    categoryChartConfig,
    duplicateCategoryValues,
    unverifiableItemsAll,
    unverifiableCount,
    typeProgress,
    overallProgress,
    ogOwnedProgress,
    missingItemsAll,
    ogMissingItemsAll,
    networth,
    money,
    inventoryValue,
    percentages,
    duplicatesCount,
    duplicatesValue,
    sortedDuplicateEntries,
    duplicatesChartData,
    totalItems,
    collectionChartConfig,
    collectionChartData,
    ogChartConfig,
    ogChartData,
  };
};
