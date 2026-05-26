"use client";

import { useEffect, useState } from "react";
import FavoriteButton from "@/components/Items/FavoriteButton";
import { fetchUserFavorites, fetchItemFavorites } from "@/utils/api/api";
import { useAuthContext } from "@/contexts/AuthContext";

interface Props {
  itemId: number;
}

export default function FavoriteButtonWrapper({ itemId }: Props) {
  const { user, isLoading: authLoading } = useAuthContext();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(true);
  const [initialFavoriteCount, setInitialFavoriteCount] = useState(0);

  useEffect(() => {
    fetchItemFavorites(String(itemId)).then((data) => {
      if (typeof data === "number") setInitialFavoriteCount(data);
      else if (data && typeof data.count === "number")
        setInitialFavoriteCount(data.count);
    });
  }, [itemId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setFavLoading(false);
      return;
    }
    fetchUserFavorites(user.id)
      .then((data) => {
        if (data !== null && Array.isArray(data)) {
          setIsFavorited(data.some((fav) => fav.item?.id === itemId));
        }
      })
      .catch(() => {})
      .finally(() => setFavLoading(false));
  }, [authLoading, user?.id, itemId]);

  if (authLoading || favLoading) {
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
    />
  );
}
