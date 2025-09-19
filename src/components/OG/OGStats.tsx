"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  user_id: string;
  logged_at: number;
  history?: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGSearchData {
  results: OGItem[];
  count: number;
  search_id: string;
  search_time: number;
}

interface OGStatsProps {
  initialData: OGSearchData | null;
}

export default function OGStats({ initialData }: OGStatsProps) {
  if (!initialData?.results) {
    return null;
  }

  // Calculate OG statistics
  const ogStats = (() => {
    const totalItems = initialData.results.length;
    const originalOwnerItems = initialData.results.filter(
      (item) => item.isOriginalOwner,
    ).length;
    const totalTrades = initialData.results.reduce(
      (sum, item) => sum + item.timesTraded,
      0,
    );
    const avgTrades = totalItems > 0 ? Math.round(totalTrades / totalItems) : 0;

    return {
      totalItems,
      originalOwnerItems,
      totalTrades,
      avgTrades,
    };
  })();

  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
      <h2 className="text-muted mb-4 text-xl font-semibold">OG Statistics</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Items */}
        <div className="rounded-lg bg-[#37424D] p-4">
          <p className="text-muted text-sm">Total Items</p>
          <p className="text-2xl font-bold text-white">{ogStats.totalItems}</p>
        </div>

        {/* Original Owner Items */}
        <div className="rounded-lg bg-[#37424D] p-4">
          <p className="text-muted text-sm">Original Items</p>
          <p className="text-2xl font-bold text-white">
            {ogStats.originalOwnerItems}
          </p>
        </div>

        {/* Total Trades */}
        <div className="rounded-lg bg-[#37424D] p-4">
          <p className="text-muted text-sm">Total Trades</p>
          <p className="text-2xl font-bold text-white">{ogStats.totalTrades}</p>
        </div>

        {/* Average Trades */}
        <div className="rounded-lg bg-[#37424D] p-4">
          <p className="text-muted text-sm">Avg Trades</p>
          <p className="text-2xl font-bold text-white">{ogStats.avgTrades}</p>
        </div>
      </div>

      {/* OG Status */}
      <div className="mt-4 rounded-lg bg-[#37424D] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted text-sm">OG Status</p>
            <p className="text-2xl font-bold text-green-400">
              {ogStats.originalOwnerItems > 0 ? "OG Player" : "Not OG"}
            </p>
          </div>
          {ogStats.originalOwnerItems > 0 && (
            <div className="flex items-center gap-2 text-green-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Original Items Found</span>
            </div>
          )}
        </div>
      </div>

      {/* OG Achievement */}
      {ogStats.originalOwnerItems > 0 && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-900/20 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
            <div>
              <h3 className="font-medium text-green-400">
                OG Player Detected!
              </h3>
              <p className="mt-1 text-sm text-green-300">
                This user has {ogStats.originalOwnerItems} original items,
                making them an OG player. These are items they originally owned
                before trading.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
