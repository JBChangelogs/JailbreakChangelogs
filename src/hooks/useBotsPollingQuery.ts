"use client";

import { useQuery } from "@tanstack/react-query";
import { pollBotsData } from "@/app/api/bots/actions";

export function useBotsPollingQuery(intervalMs: number = 30000) {
  return useQuery({
    queryKey: ["bots-polling"],
    queryFn: async () => {
      const timestamp = new Date().toISOString();
      console.log(`[POLLING] Starting data fetch at ${timestamp}`);

      const result = await pollBotsData();

      if (result.success && result.data) {
        const totalBotsCount =
          result.data.botsData?.recent_heartbeats?.length || 0;

        console.log(`[POLLING] Successfully fetched data at ${timestamp}:`, {
          botsCount: totalBotsCount,
          queueLength: result.data.queueInfo?.queue_length || 0,
          lastProcessed: result.data.queueInfo?.last_dequeue?.user_id || "none",
        });

        return result.data;
      } else {
        console.error(
          `[POLLING] Failed to fetch data at ${timestamp}:`,
          result.error,
        );
        throw new Error(result.error || "Failed to fetch bots data");
      }
    },
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
  });
}
