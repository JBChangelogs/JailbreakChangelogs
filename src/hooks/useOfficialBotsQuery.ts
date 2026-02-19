"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOfficialScanBots } from "@/utils/api";

export function useOfficialBotsQuery() {
  return useQuery({
    queryKey: ["official-bots"],
    queryFn: async () => {
      const bots = await fetchOfficialScanBots();
      const sortedBots = [...bots].sort((a, b) => {
        return b.userId - a.userId;
      });
      // Avatars are now handled client-side with direct URLs
      return {
        bots: sortedBots,
        avatarData: {}, // Empty - avatars now use direct URLs
      };
    },
  });
}
