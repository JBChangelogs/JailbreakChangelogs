"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOfficialScanBots, fetchRobloxAvatars } from "@/utils/api/api";

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
      const botIds = sortedBots.map((b) => String(b.userId));

      // Fetch avatar data for bots
      const botAvatarData =
        botIds.length > 0 ? await fetchRobloxAvatars(botIds) : {};

      return {
        bots: sortedBots,
        avatarData: botAvatarData,
      };
    },
  });
}
