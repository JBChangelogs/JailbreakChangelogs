"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

export function inventoryScanHistoryOptions(userId: string) {
  return queryOptions({
    queryKey: ["inventory-scan-history", userId],
    queryFn: async ({
      signal,
    }): Promise<Array<{ scan_id: string; created_at: number }>> => {
      const response = await fetch(
        `/api/inventories/scan-history?id=${encodeURIComponent(userId)}`,
        { signal },
      );
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
