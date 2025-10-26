import { useState, useCallback, use, useMemo } from "react";

import { ItemDetails } from "@/types";
import { demandOrder } from "@/utils/values";
import Image from "next/image";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { formatFullValue } from "@/utils/values";
import { getCategoryColor } from "@/utils/categoryIcons";
import { getTrendColor, getDemandColor } from "@/utils/badgeColors";

interface SimilarItemsProps {
  currentItem: ItemDetails;
  similarItemsPromise?: Promise<ItemDetails[] | null>;
}

type SortCriteria = "similarity" | "creator" | "trading_metrics" | "trend";

const SimilarItems = ({
  currentItem,
  similarItemsPromise,
}: SimilarItemsProps) => {
  // Use server-side data at the top level
  const serverItems = similarItemsPromise ? use(similarItemsPromise) : null;
  const typeItems: ItemDetails[] = useMemo(
    () => serverItems || [],
    [serverItems],
  );

  const [sortBy, setSortBy] = useState<SortCriteria>("similarity");

  const parseValue = (value: string): number => {
    if (value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    return num;
  };

  const calculateSimilarityScore = useCallback(
    (item1: ItemDetails, item2: ItemDetails): number => {
      let score = 0;

      // Value range similarity (50%)
      const value1 = parseValue(item1.cash_value);
      const value2 = parseValue(item2.cash_value);

      if (value1 > 0 && value2 > 0) {
        const ratio = Math.min(value1, value2) / Math.max(value1, value2);
        if (ratio >= 0.9)
          score += 0.5; // Within 10%
        else if (ratio >= 0.7)
          score += 0.3; // Within 30%
        else if (ratio >= 0.5) score += 0.1; // Within 50%
      }

      // Demand level similarity (30%)
      const demand1Index = demandOrder.indexOf(
        item1.demand as (typeof demandOrder)[number],
      );
      const demand2Index = demandOrder.indexOf(
        item2.demand as (typeof demandOrder)[number],
      );
      if (demand1Index !== -1 && demand2Index !== -1) {
        const demandDiff = Math.abs(demand1Index - demand2Index);
        if (demandDiff === 0)
          score += 0.3; // Exact match
        else if (demandDiff === 1)
          score += 0.2; // One level difference
        else if (demandDiff === 2) score += 0.1; // Two levels difference
      }

      // Limited/Seasonal status similarity (20%)
      if (
        (item1.is_limited === 1 && item2.is_limited === 1) ||
        (item1.is_seasonal === 1 && item2.is_seasonal === 1) ||
        (item1.is_limited === 0 &&
          item2.is_limited === 0 &&
          item1.is_seasonal === 0 &&
          item2.is_seasonal === 0)
      ) {
        score += 0.2;
      }

      return score;
    },
    [],
  );

  const calculateTradingMetricsScore = useCallback(
    (item1: ItemDetails, item2: ItemDetails): number => {
      let score = 0;

      // Check if both items have trading metrics
      if (!item1.metadata || !item2.metadata) {
        return 0;
      }

      const metrics1 = item1.metadata;
      const metrics2 = item2.metadata;

      // Times Traded similarity (40%)
      if (metrics1.TimesTraded && metrics2.TimesTraded) {
        const ratio =
          Math.min(metrics1.TimesTraded, metrics2.TimesTraded) /
          Math.max(metrics1.TimesTraded, metrics2.TimesTraded);
        if (ratio >= 0.9)
          score += 0.4; // Within 10%
        else if (ratio >= 0.7)
          score += 0.3; // Within 30%
        else if (ratio >= 0.5)
          score += 0.2; // Within 50%
        else if (ratio >= 0.3) score += 0.1; // Within 70%
      }

      // Unique Circulation similarity (30%)
      if (metrics1.UniqueCirculation && metrics2.UniqueCirculation) {
        const ratio =
          Math.min(metrics1.UniqueCirculation, metrics2.UniqueCirculation) /
          Math.max(metrics1.UniqueCirculation, metrics2.UniqueCirculation);
        if (ratio >= 0.9)
          score += 0.3; // Within 10%
        else if (ratio >= 0.7)
          score += 0.2; // Within 30%
        else if (ratio >= 0.5) score += 0.1; // Within 50%
      }

      // Demand Multiple similarity (30%)
      if (metrics1.DemandMultiple && metrics2.DemandMultiple) {
        const ratio =
          Math.min(metrics1.DemandMultiple, metrics2.DemandMultiple) /
          Math.max(metrics1.DemandMultiple, metrics2.DemandMultiple);
        if (ratio >= 0.9)
          score += 0.3; // Within 10%
        else if (ratio >= 0.7)
          score += 0.2; // Within 30%
        else if (ratio >= 0.5) score += 0.1; // Within 50%
      }

      return score;
    },
    [],
  );

  const calculateTrendSimilarityScore = useCallback(
    (item1: ItemDetails, item2: ItemDetails): number => {
      let score = 0;

      // Check if both items have trends
      if (
        !item1.trend ||
        !item2.trend ||
        item1.trend === "N/A" ||
        item2.trend === "N/A"
      ) {
        return 0;
      }

      // Exact trend match (60%)
      if (item1.trend === item2.trend) {
        score += 0.6;
      }

      // Similar trend categories (40%)
      const positiveTrends = ["Rising", "Hyped", "Recovering"];
      const negativeTrends = ["Dropping", "Avoided"];
      const neutralTrends = ["Stable", "Unstable"];
      const specialTrends = ["Hoarded", "Manipulated"];

      const isPositive1 = positiveTrends.includes(item1.trend);
      const isPositive2 = positiveTrends.includes(item2.trend);
      const isNegative1 = negativeTrends.includes(item1.trend);
      const isNegative2 = negativeTrends.includes(item2.trend);
      const isNeutral1 = neutralTrends.includes(item1.trend);
      const isNeutral2 = neutralTrends.includes(item2.trend);
      const isSpecial1 = specialTrends.includes(item1.trend);
      const isSpecial2 = specialTrends.includes(item2.trend);

      if (
        (isPositive1 && isPositive2) ||
        (isNegative1 && isNegative2) ||
        (isNeutral1 && isNeutral2) ||
        (isSpecial1 && isSpecial2)
      ) {
        score += 0.4;
      }

      return score;
    },
    [],
  );

  const similarItems = useMemo(() => {
    // Calculate similarity scores and sort based on selected criteria
    const itemsWithScores = typeItems
      .filter((item) => item.id !== currentItem.id) // Exclude current item
      .map((item) => ({
        item,
        similarityScore: calculateSimilarityScore(currentItem, item),
        tradingMetricsScore: calculateTradingMetricsScore(currentItem, item),
        trendScore: calculateTrendSimilarityScore(currentItem, item),
      }));

    let sortedItems: ItemDetails[] = [];
    switch (sortBy) {
      case "creator":
        // Check if current item has an unknown creator
        if (currentItem.creator === "N/A") {
          sortedItems = [];
        } else {
          sortedItems = itemsWithScores
            .filter(({ item }) => {
              // Extract creator name without ID for comparison, handling both formats
              const currentCreatorName = currentItem.creator
                .split(/[ (]/)[0]
                .toLowerCase();
              const itemCreatorName = item.creator
                .split(/[ (]/)[0]
                .toLowerCase();
              return currentCreatorName === itemCreatorName;
            })
            .sort((a, b) => {
              // Sort by similarity score within the same creator
              return b.similarityScore - a.similarityScore;
            })
            .map(({ item }) => item);
        }
        break;
      case "trading_metrics":
        sortedItems = itemsWithScores
          .filter(({ tradingMetricsScore }) => tradingMetricsScore > 0) // Only include items with trading metrics
          .sort((a, b) => b.tradingMetricsScore - a.tradingMetricsScore)
          .map(({ item }) => item);
        break;
      case "trend":
        sortedItems = itemsWithScores
          .filter(({ trendScore }) => trendScore > 0) // Only include items with trends
          .sort((a, b) => b.trendScore - a.trendScore)
          .map(({ item }) => item);
        break;
      default: // 'similarity'
        sortedItems = itemsWithScores
          .sort((a, b) => b.similarityScore - a.similarityScore)
          .map(({ item }) => item);
    }

    return sortedItems.slice(0, 6); // Get top 6
  }, [
    currentItem,
    sortBy,
    calculateSimilarityScore,
    calculateTradingMetricsScore,
    calculateTrendSimilarityScore,
    typeItems,
  ]);

  return (
    <div className="bg-secondary-bg border-border-primary hover:shadow-card-shadow space-y-6 rounded-lg border p-6 shadow-lg transition-all duration-200">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-button-info/20 flex h-8 w-8 items-center justify-center rounded-lg">
            <SparklesIcon className="text-button-info h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-primary-text text-xl font-semibold">
              Similar Items
            </h3>
          </div>
        </div>

        <select
          className="select w-full bg-primary-bg text-primary-text min-h-[56px]"
          value={sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSortBy(e.target.value as SortCriteria)
          }
        >
          <option value="similarity">Sort by Similarity</option>
          <option value="trading_metrics">Sort by Trading Metrics</option>
          <option value="trend">Sort by Trend</option>
          <option value="creator">Sort by Creator</option>
        </select>
      </div>

      {/* Content Section */}
      {!typeItems.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-3 aspect-video rounded-lg border"></div>
              <div className="bg-secondary-bg mb-2 h-4 w-3/4 rounded"></div>
              <div className="bg-secondary-bg h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : similarItems.length === 0 ? (
        <div className="bg-secondary-bg rounded-lg p-8 text-center">
          <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <SparklesIcon className="text-button-info h-8 w-8" />
          </div>
          <h4 className="text-primary-text mb-2 text-lg font-semibold">
            {sortBy === "creator" && currentItem.creator !== "N/A"
              ? "No Items from Same Creator"
              : sortBy === "trading_metrics"
                ? "No Items with Similar Trading Metrics"
                : sortBy === "trend"
                  ? "No Items with Similar Trends"
                  : "No Similar Items Found"}
          </h4>
          <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
            {sortBy === "creator" && currentItem.creator !== "N/A"
              ? `No other items by ${currentItem.creator.split(/[ (]/)[0]} were found in the ${currentItem.type} category. Try switching to "Sort by Similarity" to see items with similar values and demand.`
              : sortBy === "creator" && currentItem.creator === "N/A"
                ? "This item doesn't have a creator listed. Try switching to 'Sort by Similarity' to see items with similar values and demand."
                : sortBy === "trading_metrics"
                  ? "No items with similar trading metrics were found. This item might have unique trading patterns, or other items in this category don't have trading metrics data. Try switching to 'Sort by Similarity' to see items with similar values and demand."
                  : sortBy === "trend"
                    ? "No items with similar trends were found. Other items in this category don't have Official Trend data. Try switching to 'Sort by Similarity' to see items with similar values and demand."
                    : "We couldn't find any items similar to this one. This might be a unique item or there may not be enough data to calculate similarities."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          {similarItems.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.type.toLowerCase()}/${item.name}`}
              className="group block"
              prefetch={false}
            >
              <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border transition-all duration-300">
                {/* Media Section */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {isVideoItem(item.name) ? (
                    <video
                      src={getVideoPath(item.type, item.name)}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.log("Video error:", e);
                      }}
                      onAbort={(e) => {
                        console.log(
                          "Video aborted by browser power saving:",
                          e,
                        );
                      }}
                      onPause={(e) => {
                        console.log("Video paused:", e);
                      }}
                      onPlay={(e) => {
                        console.log("Video play attempted:", e);
                      }}
                    />
                  ) : (
                    <Image
                      src={getItemImagePath(item.type, item.name, true)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col space-y-2 p-3">
                  {/* Item Name */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-primary-text hover:text-link line-clamp-2 text-sm leading-tight font-semibold transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {/* Type Badge */}
                  <div className="flex flex-wrap gap-1">
                    <span
                      className="text-primary-text flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        borderColor: getCategoryColor(item.type),
                        backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
                      }}
                    >
                      {item.type}
                    </span>
                    {(item.tradable === 0 || item.tradable === false) && (
                      <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px]">
                        Non-Tradable
                      </span>
                    )}
                  </div>

                  {/* Values Section */}
                  <div className="space-y-1">
                    {/* Cash Value */}
                    <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Cash
                      </span>
                      <span className="bg-button-info text-form-button-text rounded-lg px-1.5 py-0.5 text-[9px] font-bold">
                        {formatFullValue(item.cash_value)}
                      </span>
                    </div>

                    {/* Duped Value */}
                    <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Duped
                      </span>
                      <span className="bg-button-info text-form-button-text rounded-lg px-1.5 py-0.5 text-[9px] font-bold">
                        {formatFullValue(item.duped_value)}
                      </span>
                    </div>

                    {/* Demand */}
                    <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Demand
                      </span>
                      <span
                        className={`${getDemandColor(item.demand)} rounded-lg px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap`}
                      >
                        {item.demand === "N/A" ? "Unknown" : item.demand}
                      </span>
                    </div>

                    {/* Trend */}
                    {item.trend && item.trend !== "N/A" && (
                      <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                        <span className="text-secondary-text text-[10px] font-medium">
                          Trend
                        </span>
                        <span
                          className={`${getTrendColor(item.trend)} rounded-lg px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap`}
                        >
                          {item.trend}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarItems;
