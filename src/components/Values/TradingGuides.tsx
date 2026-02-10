"use client";

import { useState } from "react";
import { YouTubeEmbed } from "@next/third-parties/google";
import { Icon } from "@/components/ui/IconWrapper";
import { demandOrder, trendOrder } from "@/utils/values";
import { ValueSort } from "@/types";
import { trendDescriptions } from "@/utils/tradingDefinitions";

interface TradingGuidesProps {
  valueSort: ValueSort;
  onValueSortChange: (sort: ValueSort) => void;
  onScrollToSearch: () => void;
}

export default function TradingGuides({
  valueSort,
  onValueSortChange,
  onScrollToSearch,
}: TradingGuidesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tradingTerms = [
    {
      term: "Demand",
      description: "A measurement of how desired an item is in trading",
    },
    {
      term: "Lowball",
      description:
        "When someone offers for your items but their side is lower in value and or demand",
    },
    {
      term: "Avoided",
      description:
        "Items that traders generally avoid, typically due to low demand",
    },
    {
      term: "Overpay(s)",
      description:
        "When one party offers additional value on top of an item's base value, usually due to a difference in demand between the two parties",
    },
    {
      term: "Base value",
      description:
        "The flat value of an item without factoring in its pull power",
    },
    {
      term: "Pull power / Pull value",
      description:
        "The highest value an item can consistently obtain in trades based on current market demand and offers",
    },
    { term: "LF", description: "Looking for" },
    { term: "D", description: "Duped; items that are duped" },
    { term: "C", description: "Clean; items that are not duped" },
    { term: "TR", description: "Trading" },
    { term: "IA", description: "Instant accept" },
    { term: "AA", description: "Auto Accept" },
    { term: "MLF", description: "Mainly looking for" },
    { term: "NLF", description: "Not looking for" },
    {
      term: "W",
      description:
        "Win; a trade in which one side clearly receives greater overall value or demand",
    },
    {
      term: "L",
      description:
        "Loss; a trade in which one side clearly receives lower overall value or demand",
    },
    {
      term: "F",
      description: "Fair; a trade balanced in value and/or demand",
    },
    {
      term: "WFL",
      description:
        "Win/Fair/Loss. Asking if a particular trade is or was good (e.g: Was this a win, fair, or loss?)",
    },
    {
      term: "Adds",
      description:
        "Additional items included in a trade to compensate for a value or demand imbalance",
    },
    {
      term: "Downgrade",
      description: "Trading one high-value item for multiple lower-value items",
    },
    {
      term: "Upgrade",
      description:
        "Trading multiple lower-value items for one higher-value item",
    },
  ];

  const getDemandHexColor = (demand: string): string => {
    switch (demand) {
      case "Close to none":
        return "#4b5563";
      case "Very Low":
        return "#dc2626";
      case "Low":
        return "#b45309";
      case "Medium":
        return "#b45309";
      case "Decent":
        return "#15803d";
      case "High":
        return "#2563eb";
      case "Very High":
        return "#9333ea";
      case "Extremely High":
        return "#db2777";
      default:
        return "#4b5563";
    }
  };

  const getDemandValue = (demand: string): string => {
    switch (demand) {
      case "Close to none":
        return "demand-close-to-none";
      case "Very Low":
        return "demand-very-low";
      case "Low":
        return "demand-low";
      case "Medium":
        return "demand-medium";
      case "Decent":
        return "demand-decent";
      case "High":
        return "demand-high";
      case "Very High":
        return "demand-very-high";
      case "Extremely High":
        return "demand-extremely-high";
      default:
        return "demand-close-to-none";
    }
  };

  const handleDemandClick = (demand: string) => {
    const demandValue = getDemandValue(demand);
    if (valueSort === demandValue) {
      onValueSortChange("cash-desc");
    } else {
      onValueSortChange(demandValue as ValueSort);
    }
    onScrollToSearch();
  };

  const getTrendHexColor = (trend: string): string => {
    switch (trend) {
      case "Dropping":
        return "#e11d48";
      case "Unstable":
        return "#b45309";
      case "Hoarded":
        return "#7c3aed";
      case "Manipulated":
        return "#ca8a04";
      case "Stable":
        return "#6b7280";
      case "Recovering":
        return "#ea580c";
      case "Rising":
        return "#1d4ed8";
      case "Hyped":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  const getTrendValue = (trend: string): string => {
    switch (trend) {
      case "Dropping":
        return "trend-dropping";
      case "Unstable":
        return "trend-unstable";
      case "Hoarded":
        return "trend-hoarded";
      case "Manipulated":
        return "trend-manipulated";
      case "Stable":
        return "trend-stable";
      case "Recovering":
        return "trend-recovering";
      case "Rising":
        return "trend-rising";
      case "Hyped":
        return "trend-hyped";
      default:
        return "trend-stable";
    }
  };

  const handleTrendClick = (trend: string) => {
    const trendValue = getTrendValue(trend);
    if (valueSort === trendValue) {
      onValueSortChange("cash-desc");
    } else {
      onValueSortChange(trendValue as ValueSort);
    }
    onScrollToSearch();
  };

  return (
    <div className="border-secondary-text mt-8 border-t pt-8">
      {/* Collapsible Header */}
      <button
        onClick={() => {
          const newExpanded = !isExpanded;
          if (newExpanded) {
            window.umami?.track("Trading Guides Expanded");
          }
          setIsExpanded(newExpanded);
        }}
        className="border-border-primary bg-primary-bg hover:border-border-focus hover:bg-primary-bg mb-4 flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-primary-text text-xl font-semibold">
            Trading Guides & Information
          </h3>
          {!isExpanded && (
            <span className="bg-button-info text-form-button-text hidden animate-pulse items-center rounded-full px-2 py-1 text-xs font-medium md:inline-flex">
              Click me!
            </span>
          )}
        </div>
        {isExpanded ? (
          <Icon
            icon="heroicons-outline:chevron-up"
            className="text-secondary-text h-5 w-5"
            inline={true}
          />
        ) : (
          <Icon
            icon="heroicons-outline:chevron-down"
            className="text-secondary-text h-5 w-5"
            inline={true}
          />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-8">
          {/* Top Section: Notes, Demand, and Video */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start xl:grid-cols-[1fr_400px]">
            <div className="min-w-0">
              <h3 className="text-primary-text mb-2 text-xl font-semibold">
                Trader Notes
              </h3>
              <ul className="text-secondary-text mb-6 list-inside list-disc space-y-2">
                <li>
                  This is NOT an official list, it is 100% community based
                </li>
                <li>
                  Some values may be outdated but we do our best to make sure
                  it&apos;s accurate as possible
                </li>
                <li>
                  Please don&apos;t 100% rely on the value list, use your own
                  judgment as well
                </li>
                <li>
                  If an item&apos;s duped value is marked as &quot;N/A&quot;, it
                  means the duped value is the same as the clean value
                </li>
              </ul>

              <h3 className="text-primary-text mb-4 text-xl font-semibold">
                Demand Levels Guide
              </h3>
              <div className="mb-4 flex flex-wrap gap-3">
                {demandOrder.map((demand) => (
                  <button
                    key={demand}
                    onClick={() => handleDemandClick(demand)}
                    className={`bg-primary-bg flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-2 transition-all focus:outline-none ${
                      valueSort === getDemandValue(demand) ? "ring-2" : ""
                    }`}
                    style={
                      {
                        borderColor: getDemandHexColor(demand),
                        "--tw-ring-color": getDemandHexColor(demand),
                      } as React.CSSProperties
                    }
                  >
                    <span className="text-primary-text text-sm font-semibold">
                      {demand}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-secondary-text text-sm">
                <strong>Note:</strong> Demand levels are ranked from lowest to
                highest. Items with higher demand are generally easier to trade
                and may have better values.
              </p>
            </div>

            {/* Video positioned at top right */}
            <div className="flex flex-col items-center lg:items-end">
              <div className="border-border-primary bg-tertiary-bg w-full max-w-[400px] overflow-hidden rounded-xl border shadow-lg">
                <YouTubeEmbed
                  videoid="Yn38fUrV7zo"
                  height={225}
                  params="controls=0&rel=0"
                />
              </div>
              <p className="text-secondary-text mt-2 w-full max-w-[400px] text-center text-[10px] italic lg:text-right">
                Learn how to access the Trading Hub
              </p>
            </div>
          </div>

          <hr className="border-secondary-text opacity-20" />

          {/* Bottom Sections: Full Width Trend and Terms */}
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h3 className="text-primary-text mb-4 text-xl font-semibold">
                Trend Levels Guide
              </h3>
              <div className="border-border-primary bg-tertiary-bg mb-4 max-h-[400px] overflow-y-auto rounded-lg border p-4 sm:max-h-none sm:border-0 sm:bg-transparent sm:p-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {trendOrder.map((trend) => (
                    <button
                      key={trend}
                      onClick={() => handleTrendClick(trend)}
                      className={`bg-primary-bg hover:bg-opacity-80 flex cursor-pointer flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all focus:outline-none ${
                        valueSort === getTrendValue(trend) ? "ring-2" : ""
                      }`}
                      style={
                        {
                          borderColor: getTrendHexColor(trend),
                          "--tw-ring-color": getTrendHexColor(trend),
                        } as React.CSSProperties
                      }
                    >
                      <span
                        className="rounded px-2 py-0.5 text-xs font-bold tracking-wider text-white uppercase"
                        style={{ backgroundColor: getTrendHexColor(trend) }}
                      >
                        {trend}
                      </span>
                      <p className="text-secondary-text text-xs leading-relaxed">
                        {trendDescriptions[trend]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-primary-text mb-4 text-xl font-semibold">
                Common Trading Terms
              </h3>
              <div className="border-border-primary bg-tertiary-bg max-h-[300px] overflow-y-auto rounded-lg border p-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {tradingTerms.map((item) => (
                    <div
                      key={item.term}
                      className="border-border-secondary border-b pb-3 last:border-0 md:border-0 md:pb-0"
                    >
                      <span className="text-link font-bold">{item.term}: </span>
                      <span className="text-secondary-text text-sm">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
