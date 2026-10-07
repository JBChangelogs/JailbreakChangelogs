"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { FavoriteItem } from "@/types";
import { fetchUserFavorites } from "@/utils/api/api";

export function userFavoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["user-favorites", userId],
    queryFn: async (): Promise<FavoriteItem[]> => {
      const data = await fetchUserFavorites(userId, true);
      if (data === null) return [];
      if (!Array.isArray(data))
        throw new Error("Invalid user favorites response");
      return data as FavoriteItem[];
    },
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useUserFavorites(userId: string | null | undefined) {
  return useQuery({
    ...userFavoritesQueryOptions(userId ?? ""),
    enabled: Boolean(userId),
  });
}
