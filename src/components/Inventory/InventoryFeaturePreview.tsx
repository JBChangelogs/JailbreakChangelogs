import { useId, useState, type MouseEvent } from "react";
import type { InventoryData } from "@/app/inventories/types";
import type { Item } from "@/types";
import type { UserNetworthData } from "@/utils/api/api";
import { Button } from "@/components/ui/button";
import CategoryProgressBar from "@/components/Inventory/Breakdown/CategoryProgressBar";
import {
  formatInventoryCount,
  formatPercentage,
} from "@/components/Inventory/Breakdown/constants";
import { useInventoryBreakdownStats } from "@/hooks/useInventoryBreakdownStats";
import { usePartialItems } from "@/hooks/usePartialItems";
import { Icon } from "@/components/ui/IconWrapper";

export default function InventoryFeaturePreview({
  networthData,
  itemsData,
  inventoryData,
  isOwnInventory = false,
  ownerName,
  tabs,
  onExplore,
}: {
  networthData: UserNetworthData[];
  itemsData: Item[];
  inventoryData: InventoryData;
  isOwnInventory?: boolean;
  ownerName?: string;
  tabs: Record<
    "breakdown" | "trades" | "copies" | "dupes" | "graphs" | "comments",
    number | null
  >;
  onExplore: (
    event: MouseEvent<HTMLButtonElement>,
    tab: number,
    section?: "unverifiable-items",
  ) => void;
}) {
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const featuresId = useId();
  const catalog = usePartialItems(tabs.breakdown !== null);
  const stats = useInventoryBreakdownStats(
    networthData,
    itemsData,
    inventoryData,
    catalog.data ?? [],
  );
  const categories = stats.categoryChartData.filter((entry) => entry.value > 0);
  const progress = stats.overallProgress;

  const features = [
    {
      tab: tabs.trades,
      title: "Trade History",
      description: "See past trades",
      icon: "lucide:history",
    },
    {
      tab: tabs.copies,
      title: "Multiple Copies",
      description: "Find repeated items",
      icon: "lucide:copy",
    },
    {
      tab: tabs.dupes,
      title: "Duplicate Items",
      description: "Check flagged dupes",
      icon: "lucide:shield-alert",
    },
    {
      tab: tabs.graphs,
      title: "Graphs",
      description: "Track networth",
      icon: "lucide:chart-no-axes-combined",
    },
    {
      tab: tabs.comments,
      title: "Comments",
      description: "Join the discussion",
      icon: "lucide:message-square",
    },
  ];
  const showBreakdown = tabs.breakdown !== null && categories.length > 0;

  if (!showBreakdown && features.every((feature) => feature.tab === null))
    return null;

  return (
    <section aria-label="Explore inventory features" className="mt-4">
      <h2>
        <button
          type="button"
          className="border-border-card bg-secondary-bg hover:bg-tertiary-bg focus-visible:ring-border-focus flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-expanded={featuresExpanded}
          aria-controls={featuresId}
          onClick={() => setFeaturesExpanded((expanded) => !expanded)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-primary-text text-sm font-semibold">
              {isOwnInventory
                ? "Explore your inventory"
                : ownerName
                  ? `Explore ${ownerName}’s inventory`
                  : "Explore this inventory"}
            </span>
            {tabs.breakdown !== null && (
              <span className="text-secondary-text text-xs">
                {catalog.data && progress.total > 0 ? (
                  <>
                    Collection: {formatPercentage(progress.percentage)}%{" · "}
                    {formatInventoryCount(progress.missingCount)}{" "}
                    {progress.missingCount === 1 ? "item" : "items"} missing
                  </>
                ) : catalog.isPending ? (
                  "Loading collection progress…"
                ) : (
                  "Explore collection progress and missing items"
                )}
              </span>
            )}
          </span>
          <Icon
            icon="lucide:chevron-down"
            aria-hidden="true"
            className={`text-secondary-text size-4 shrink-0 ${featuresExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div
        id={featuresId}
        hidden={!featuresExpanded}
        className="mt-2 space-y-2"
      >
        {showBreakdown && (
          <div className="border-border-card bg-secondary-bg rounded-lg border p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-primary-text flex items-center gap-2 font-semibold">
                  <Icon
                    icon="lucide:chart-pie"
                    aria-hidden="true"
                    className="text-link size-4"
                  />
                  Inventory Breakdown
                </h3>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={(event) => {
                  if (tabs.breakdown !== null) onExplore(event, tabs.breakdown);
                }}
              >
                View breakdown{" "}
                <Icon icon="lucide:arrow-right" aria-hidden="true" />
              </Button>
            </div>
            <div className="border-border-card mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
              <div>
                <h4 className="text-primary-text mb-2 text-[13px] font-medium">
                  Clean inventory value by category
                </h4>
                <CategoryProgressBar
                  className="h-3!"
                  entries={categories.map((entry) => ({
                    key: entry.category,
                    label: entry.category,
                    widthPercent: entry.value,
                    color: entry.fill,
                    tooltip: `${entry.category}: ${formatPercentage(entry.value)}%`,
                  }))}
                  emptyMessage="No category values available"
                />
                <ul className="text-secondary-text mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  {categories.slice(0, 3).map((entry) => (
                    <li
                      key={entry.category}
                      className="flex items-center gap-1.5"
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                      />
                      {entry.category} {formatPercentage(entry.value)}%
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-primary-text mb-2 text-[13px] font-medium">
                  Collection progress
                </h4>
                {catalog.data && progress.total > 0 ? (
                  <>
                    <progress
                      aria-label="Collection completion"
                      value={progress.owned}
                      max={progress.total}
                      className="bg-quaternary-bg [&::-moz-progress-bar]:bg-button-info [&::-webkit-progress-bar]:bg-quaternary-bg [&::-webkit-progress-value]:bg-button-info block h-3 w-full appearance-none overflow-hidden rounded-full border-0 [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full"
                    />
                    <p className="text-secondary-text mt-2 text-[13px]">
                      <span className="text-primary-text font-medium">
                        {formatPercentage(progress.percentage)}% complete
                      </span>
                      {" · "}
                      {formatInventoryCount(progress.missingCount)}{" "}
                      {progress.missingCount === 1 ? "item" : "items"} missing
                    </p>
                    <p className="text-secondary-text mt-1 text-xs">
                      Hyperchromes:{" "}
                      {stats.countLowerLevels
                        ? "lower levels count"
                        : "count owned levels only"}
                      .
                    </p>
                    {stats.unverifiableCount > 0 && (
                      <p className="text-secondary-text mt-1 text-[13px]">
                        {formatInventoryCount(stats.unverifiableCount)}{" "}
                        unverifiable{" "}
                        {stats.unverifiableCount === 1 ? "item" : "items"}{" "}
                        assumed owned.{" "}
                        <button
                          type="button"
                          className="text-link cursor-pointer underline underline-offset-2 focus-visible:outline-2"
                          onClick={(event) => {
                            if (tabs.breakdown !== null)
                              onExplore(
                                event,
                                tabs.breakdown,
                                "unverifiable-items",
                              );
                          }}
                        >
                          View items
                        </button>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-secondary-text text-[13px]">
                    {catalog.isPending
                      ? "Loading collection progress…"
                      : "Open Breakdown to explore collection progress and missing items."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {features.map((feature) =>
            feature.tab === null ? null : (
              <button
                key={feature.title}
                type="button"
                data-inventory-tab={feature.tab}
                onClick={(event) => {
                  if (feature.tab !== null) onExplore(event, feature.tab);
                }}
                className="group border-border-card bg-secondary-bg hover:bg-tertiary-bg focus-visible:ring-border-focus flex cursor-pointer flex-col items-start rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="text-primary-text flex w-full items-center gap-2 text-sm font-semibold">
                  <Icon
                    icon={feature.icon}
                    aria-hidden="true"
                    className="text-link size-4 shrink-0"
                  />
                  {feature.title}
                  <Icon
                    icon="lucide:arrow-right"
                    aria-hidden="true"
                    className="text-secondary-text ml-auto size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-secondary-text mt-1 text-sm">
                  {feature.description}
                </span>
              </button>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
