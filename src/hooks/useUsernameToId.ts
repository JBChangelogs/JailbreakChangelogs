"use client";

import { useQueryClient } from "@tanstack/react-query";
import { fetchRobloxUserByUsername, MaxStreamsError } from "@/utils/api";

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
      retry: (failureCount, error) => {
        // Don't retry on MaxStreamsError - it's a temporary server issue that won't be fixed by retrying
        if (error instanceof MaxStreamsError) {
          return false;
        }
        // Default retry behavior for other errors (retry up to 3 times)
        return failureCount < 3;
      },
    });

    return data && data.id ? String(data.id) : null;
  };

  return { getId };
}
