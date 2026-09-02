"use client";

import { useRef } from "react";
import type { UserNetworthData } from "@/utils/api/api";
import type { Item } from "@/types";
import type { InventoryData } from "@/app/inventories/types";
import CollectionProgressSection from "@/components/Inventory/Breakdown/CollectionProgressSection";
import OgOwnedSection from "@/components/Inventory/Breakdown/OgOwnedSection";
import OverviewStatsCard from "@/components/Inventory/Breakdown/OverviewStatsCard";
import ValueBreakdownSection from "@/components/Inventory/Breakdown/ValueBreakdownSection";
import { useInventoryBreakdownStats } from "@/hooks/useInventoryBreakdownStats";

interface InventoryBreakdownProps {
  networthData: UserNetworthData[];
  username: string;
  itemsData: Item[];
  inventoryData: InventoryData;
  isActive?: boolean;
}

export default function InventoryBreakdown({
  networthData,
  itemsData,
  inventoryData,
  isActive = true,
}: InventoryBreakdownProps) {
  // Once the tab becomes active, keep charts rendered permanently to avoid
  // re-mounting them on every tab switch (isActive changes are ignored by memo).
  const hasBeenActiveRef = useRef(isActive);
  if (isActive) hasBeenActiveRef.current = true;
  const renderCharts = hasBeenActiveRef.current;

  const stats = useInventoryBreakdownStats(
    networthData,
    itemsData,
    inventoryData,
  );

  const unverifiableSectionRef = useRef<HTMLDivElement>(null);

  const scrollToUnverifiableSection = () => {
    const target = unverifiableSectionRef.current;
    if (!target) return;

    const rectTop = target.getBoundingClientRect().top;
    const absoluteTop = rectTop + window.scrollY;

    const rawHeaderHeight = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--header-height");
    const headerHeight = Number.parseFloat(rawHeaderHeight || "0") || 0;

    const extraPadding = 12;
    const top = Math.max(0, absoluteTop - headerHeight - extraPadding);
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (!stats.latestData || !stats.latestData.percentages) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <p className="text-secondary-text">
          No breakdown data available for this inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OverviewStatsCard
        totalItems={stats.totalItems}
        networth={stats.networth}
        inventoryValue={stats.inventoryValue}
        money={stats.money}
      />

      <CollectionProgressSection
        itemsAvailable={itemsData.length > 0}
        overallProgress={stats.overallProgress}
        typeProgress={stats.typeProgress}
        unverifiableCount={stats.unverifiableCount}
        missingItemsAll={stats.missingItemsAll}
        unverifiableItemsAll={stats.unverifiableItemsAll}
        collectionChartConfig={stats.collectionChartConfig}
        collectionChartData={stats.collectionChartData}
        renderCharts={renderCharts}
        unverifiableSectionRef={unverifiableSectionRef}
        onViewUnverifiable={scrollToUnverifiableSection}
      />

      <OgOwnedSection
        itemsAvailable={itemsData.length > 0}
        ogOwnedProgress={stats.ogOwnedProgress}
        typeProgress={stats.typeProgress}
        ogMissingItemsAll={stats.ogMissingItemsAll}
        unverifiableCount={stats.unverifiableCount}
        ogChartConfig={stats.ogChartConfig}
        ogChartData={stats.ogChartData}
        renderCharts={renderCharts}
        onViewUnverifiable={scrollToUnverifiableSection}
      />

      <ValueBreakdownSection
        title="Inventory Breakdown"
        pieTitle="Inventory Breakdown Pie Chart"
        tooltipContent={
          <>
            How your clean inventory&apos;s total value is distributed across
            item categories.
          </>
        }
        percentages={stats.percentages ?? {}}
        categoryValues={stats.categoryValues}
        sortedEntries={stats.sortedCategoryEntries}
        chartData={stats.categoryChartData}
        chartConfig={stats.categoryChartConfig}
        emptyMessage="No breakdown available for this inventory"
        renderCharts={renderCharts}
        layoutVariant="inventory"
      />

      {stats.duplicatesCount !== undefined &&
        stats.duplicatesValue !== undefined &&
        stats.duplicatesValue !== null &&
        stats.sortedDuplicateEntries.length > 0 && (
          <ValueBreakdownSection
            title="Duplicate Inventory Breakdown"
            pieTitle="Duplicate Inventory Breakdown Pie Chart"
            tooltipContent={
              <>
                How your duplicated items&apos; total value is distributed
                across item categories.
              </>
            }
            percentages={Object.fromEntries(stats.sortedDuplicateEntries)}
            categoryValues={stats.duplicateCategoryValues}
            sortedEntries={stats.sortedDuplicateEntries}
            chartData={stats.duplicatesChartData}
            chartConfig={stats.categoryChartConfig}
            emptyMessage="No breakdown available for this inventory"
            renderCharts={renderCharts}
            layoutVariant="duplicates"
          />
        )}
    </div>
  );
}
