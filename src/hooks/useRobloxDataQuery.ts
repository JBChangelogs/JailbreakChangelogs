"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRobloxUsersBatch } from "@/utils/api/api";

async function fetchUsersData(userIds: string[]) {
  const users = await fetchRobloxUsersBatch(userIds).catch(() => null);
  return { usersData: users && "data" in users ? null : users };
}

export function useRobloxBotsDataQuery(botIds: string[] | null) {
  return useQuery({
    queryKey: ["roblox-bots-data", botIds?.sort().join(",")],
    queryFn: () => fetchUsersData(botIds!),
    enabled: !!botIds && botIds.length > 0,
  });
}

export function useRobloxUserDataQuery(userId: string | null) {
  return useQuery({
    queryKey: ["roblox-user-data", userId],
    queryFn: () => fetchUsersData([userId!]),
    enabled: !!userId,
  });
}
