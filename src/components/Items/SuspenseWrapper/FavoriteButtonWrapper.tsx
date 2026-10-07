"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FavoriteItem } from "@/types";
import FavoriteButton from "@/components/Items/FavoriteButton";
import { fetchItemFavorites } from "@/utils/api/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserFavorites } from "@/hooks/useUserFavorites";

interface Props {
  itemId: number;
}

export default function FavoriteButtonWrapper({ itemId }: Props) {
  const { user, isLoading: authLoading } = useAuthContext();
  const queryClient = useQueryClient();
  const favoritesQuery = useUserFavorites(user?.id);
  const countQuery = useQuery({
    queryKey: ["item-favorites", itemId],
    queryFn: async () => {
      const count = await fetchItemFavorites(String(itemId));
      if (count === null) throw new Error("Failed to fetch item favorites");
      return count;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const isFavorited =
    favoritesQuery.data?.some((fav) => fav.item?.id === itemId) ?? false;
  const countData = countQuery.data;
  const initialFavoriteCount =
    typeof countData === "number"
      ? countData
      : countData && typeof countData.count === "number"
        ? countData.count
        : 0;

  if (
    authLoading ||
    countQuery.isPending ||
    (user?.id && favoritesQuery.isPending)
  ) {
    return (
      <div className="bg-secondary-bg h-8 w-24 animate-pulse rounded-lg" />
    );
  }

  return (
    <FavoriteButton
      itemId={itemId}
      isAuthenticated={!!user}
      initialIsFavorited={isFavorited}
      initialCount={initialFavoriteCount}
      item={queryClient.getQueryData<FavoriteItem["item"]>([
        "item",
        "id",
        itemId,
      ])}
    />
  );
}
