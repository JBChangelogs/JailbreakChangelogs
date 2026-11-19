"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHomepageImpactStats, fetchNetworthCap } from "@/utils/api/api";
import CountUpNumber from "./CountUpNumber";

export type InventoryHeroStatKey =
  | "items_tracked"
  | "users_scanned"
  | "total_networth";

export default function InventoryHeroStat({
  stat,
}: {
  stat: InventoryHeroStatKey;
}) {
  const { data: value = 0 } = useQuery({
    queryKey: ["homepage-inventory-stats"],
    queryFn: async () => {
      const [impact, cap] = await Promise.all([
        fetchHomepageImpactStats(),
        fetchNetworthCap(),
      ]);
      return {
        items_tracked: impact?.items_tracked ?? 0,
        users_scanned: impact?.users_scanned ?? 0,
        total_networth: cap?.total_networth ?? 0,
      };
    },
    select: (stats) => stats[stat],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return (
    <span title={value.toLocaleString("en-US")}>
      <CountUpNumber value={value} compact />
    </span>
  );
}
