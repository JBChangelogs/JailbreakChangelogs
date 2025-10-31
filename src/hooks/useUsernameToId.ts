"use client";

import { useQueryClient } from "@tanstack/react-query";
import { fetchRobloxUserByUsername } from "@/utils/api";

type RobloxUserLookup = {
  id?: number;
} | null;

function queryKey(username: string) {
  return ["robloxUserIdByUsername", username.toLowerCase().trim()];
}

export function useUsernameToId() {
  const queryClient = useQueryClient();

  const getId = async (username: string): Promise<string | null> => {
    const key = queryKey(username);
    const cached = queryClient.getQueryData<{ id?: number } | null>(key);
    if (cached && cached.id) return String(cached.id);

    const data = await queryClient.fetchQuery<RobloxUserLookup>({
      queryKey: key,
      queryFn: async () => {
        const result = await fetchRobloxUserByUsername(username);
        return (result as RobloxUserLookup) || null;
      },
    });

    return data && data.id ? String(data.id) : null;
  };

  return { getId };
}
