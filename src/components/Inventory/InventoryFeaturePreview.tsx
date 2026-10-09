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
  const dupedCount = inventoryData.duplicates?.length ?? 0;

  const features = [
    {
      tab: tabs.trades,
      title: "Trade History",
      description: "Explore past trades and counterparties.",
      icon: "lucide:history",
    },
    {
      tab: tabs.copies,
      title: "Multiple Copies",
      description: "Find repeated items and compare copy counts.",
      icon: "lucide:copy",
    },
    {
      tab: tabs.dupes,
      title: "Duplicate Items",
      description:
        dupedCount > 0
          ? `${formatInventoryCount(dupedCount)} ${dupedCount === 1 ? "item" : "items"} flagged as duplicated.`
          : "Inspect items flagged as duplicated.",
      icon: "lucide:shield-alert",
    },
    {
      tab: tabs.graphs,
      title: "Graphs",
      description:
        networthData.length > 0
          ? `${isOwnInventory ? "Your networth" : "Networth"} across ${formatInventoryCount(networthData.length)} recorded ${networthData.length === 1 ? "snapshot" : "snapshots"}.`
          : "Track networth and cash over time.",
      icon: "lucide:chart-no-axes-combined",
    },
    {
      tab: tabs.comments,
      title: "Comments",
      description: "Ask questions and discuss this inventory.",
      icon: "lucide:message-square",
    },
  ];
  const showBreakdown = tabs.breakdown !== null && categories.length > 0;

  if (!showBreakdown && features.every((feature) => feature.tab === null))
    return null;

  return (
    <section aria-label="Explore inventory features" className="mt-6">
      <div className="border-border-card bg-secondary-bg flex items-center justify-between gap-3 rounded-lg border p-3 sm:block sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
        <div className="min-w-0">
          <h2 className="text-primary-text truncate text-sm font-semibold sm:text-base">
            {isOwnInventory
              ? "Explore your inventory"
              : ownerName
                ? `Explore ${ownerName}’s inventory`
                : "Explore this inventory"}
          </h2>
          <p className="text-secondary-text mt-1 hidden text-sm sm:block">
            See more than the item list. Choose what you want to explore.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="sm:hidden"
          aria-expanded={featuresExpanded}
          aria-controls={featuresId}
          onClick={() => setFeaturesExpanded((expanded) => !expanded)}
        >
          {featuresExpanded ? "Hide features" : "View features"}
          <Icon
            icon="lucide:chevron-down"
            aria-hidden="true"
            className={featuresExpanded ? "rotate-180" : ""}
          />
        </Button>
      </div>
      <div
        id={featuresId}
        className={`mt-3 space-y-3 ${featuresExpanded ? "" : "hidden sm:block"}`}
      >
        {showBreakdown && (
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-primary-text flex items-center gap-2 font-semibold">
                  <Icon
                    icon="lucide:chart-pie"
                    aria-hidden="true"
                    className="text-link size-4"
                  />
                  Inventory Breakdown
                </h3>
                <p className="text-secondary-text mt-1 text-sm">
                  Explore value charts, collection progress, and missing items.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={(event) => {
                  if (tabs.breakdown !== null) onExplore(event, tabs.breakdown);
                }}
              >
                Explore breakdown{" "}
                <Icon icon="lucide:arrow-right" aria-hidden="true" />
              </Button>
            </div>
            <div className="border-border-card mt-4 grid gap-5 border-t pt-4 sm:grid-cols-2">
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
                      className="bg-tertiary-bg [&::-moz-progress-bar]:bg-button-info [&::-webkit-progress-bar]:bg-tertiary-bg [&::-webkit-progress-value]:bg-button-info block h-3 w-full appearance-none overflow-hidden rounded-full border-0 [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full"
                    />
                    <p className="text-secondary-text mt-2 text-[13px]">
                      <span className="text-primary-text font-medium">
                        {formatPercentage(progress.percentage)}% complete
                      </span>
                      {" · "}
                      {formatInventoryCount(progress.missingCount)}{" "}
                      {progress.missingCount === 1 ? "item" : "items"} missing
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature) =>
            feature.tab === null ? null : (
              <button
                key={feature.title}
                type="button"
                data-inventory-tab={feature.tab}
                onClick={(event) => {
                  if (feature.tab !== null) onExplore(event, feature.tab);
                }}
                className="group border-border-card bg-secondary-bg hover:bg-tertiary-bg focus-visible:ring-border-focus flex cursor-pointer flex-col items-start justify-start rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                <span className="text-secondary-text mt-1.5 block text-sm leading-relaxed">
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
