"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchConnectedBots, fetchQueueInfo } from "@/utils/api/api";

export function useBotsPollingQuery(intervalMs: number = 30000) {
  return useQuery({
    queryKey: ["bots-polling"],
    queryFn: async () => {
      const [botsData, queueInfo] = await Promise.all([
        fetchConnectedBots({ includePrivate: true }),
        fetchQueueInfo({ includePrivate: true }),
      ]);
      return { botsData, queueInfo };
    },
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
  });
}
