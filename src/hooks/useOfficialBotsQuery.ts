"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOfficialScanBots } from "@/utils/api";

export function useOfficialBotsQuery() {
  return useQuery({
    queryKey: ["official-bots"],
    queryFn: async () => {
      const bots = await fetchOfficialScanBots();
      const sortedBots = [...bots].sort((a, b) => {
        const aName = (a.username || "").toLowerCase();
        const bName = (b.username || "").toLowerCase();
        return aName.localeCompare(bName);
      });
      // Avatars are now handled client-side with direct URLs
      return {
        bots: sortedBots,
        avatarData: {}, // Empty - avatars now use direct URLs
      };
    },
  });
}
