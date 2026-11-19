"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { INVENTORY_API_URL } from "@/utils/api/api";

export function inventoryScanHistoryOptions(userId: string) {
  return queryOptions({
    queryKey: ["inventory-scan-history", userId],
    queryFn: async ({
      signal,
    }): Promise<Array<{ scan_id: string; created_at: number }>> => {
      const response = await fetch(
        `${INVENTORY_API_URL}/v2/users/${encodeURIComponent(userId)}/scans?limit=1000`,
        { credentials: "include", signal },
      );
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("Failed to fetch scan history");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useInventoryScanHistory(userId: string, enabled: boolean) {
  return useQuery({ ...inventoryScanHistoryOptions(userId), enabled });
}
