"use client";

import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { fetchItemCountStats, fetchDuplicatesCount } from "@/utils/api/api";
import CountUpNumber from "@/components/Home/CountUpNumber";

export default function StatsPolling() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["item-count-stats"],
    queryFn: fetchItemCountStats,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  const { data: duplicatesStats, isLoading: isLoadingDuplicates } = useQuery({
    queryKey: ["duplicates-count"],
    queryFn: fetchDuplicatesCount,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  if (isLoadingStats || isLoadingDuplicates) {
    return <StatsSkeleton />;
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatTile
        icon="heroicons:cube"
        label="Items tracked"
        value={stats?.item_count ?? 0}
      />
      <StatTile
        icon="heroicons:user-group-solid"
        label="Users scanned"
        value={stats?.user_count ?? 0}
      />
      <StatTile
        icon="heroicons:document-duplicate"
        label="Total duplicates"
        value={duplicatesStats?.total_duplicates ?? 0}
      />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-5">
      <div className="text-secondary-text flex items-center gap-2">
        <Icon icon={icon} className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-semibold">{label}</span>
      </div>
      <div className="text-primary-text mt-2 text-3xl font-bold">
        <CountUpNumber value={value} />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="border-border-card bg-secondary-bg rounded-lg border p-5"
        >
          <div className="bg-button-secondary mb-3 h-5 w-36 animate-pulse rounded"></div>
          <div className="bg-button-secondary h-9 w-40 animate-pulse rounded"></div>
        </div>
      ))}
    </div>
  );
}
