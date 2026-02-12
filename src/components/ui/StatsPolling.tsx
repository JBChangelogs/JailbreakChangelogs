"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchItemCountStats, fetchDuplicatesCount } from "@/utils/api";

export default function StatsPolling() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["item-count-stats"],
    queryFn: fetchItemCountStats,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: duplicatesStats, isLoading: isLoadingDuplicates } = useQuery({
    queryKey: ["duplicates-count"],
    queryFn: fetchDuplicatesCount,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  if (isLoadingStats || isLoadingDuplicates) {
    return <StatsSkeleton />;
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {stats?.item_count_str || "0"}
        </div>
        <div className="text-secondary-text text-sm">Items Tracked</div>
      </div>
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {stats?.user_count_str || "0"}
        </div>
        <div className="text-secondary-text text-sm">Users Scanned</div>
      </div>
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {duplicatesStats?.total_duplicates_str || "0"}
        </div>
        <div className="text-secondary-text text-sm">Total Duplicates</div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
    </div>
  );
}
