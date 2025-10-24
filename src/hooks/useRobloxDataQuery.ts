"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchRobloxDataForBots,
  fetchRobloxDataForUser,
} from "@/app/api/bots/actions";

export function useRobloxBotsDataQuery(botIds: string[] | null) {
  return useQuery({
    queryKey: ["roblox-bots-data", botIds?.sort().join(",")],
    queryFn: async () => {
      if (!botIds || botIds.length === 0) {
        return {
          usersData: null,
          avatarsData: {},
        };
      }

      const result = await fetchRobloxDataForBots(botIds);

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || "Failed to fetch Roblox bot data");
    },
    enabled: !!botIds && botIds.length > 0,
  });
}

export function useRobloxUserDataQuery(userId: string | null) {
  return useQuery({
    queryKey: ["roblox-user-data", userId],
    queryFn: async () => {
      if (!userId) {
        return {
          usersData: null,
          avatarsData: {},
        };
      }

      const result = await fetchRobloxDataForUser(userId);

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || "Failed to fetch Roblox user data");
    },
    enabled: !!userId,
  });
}
