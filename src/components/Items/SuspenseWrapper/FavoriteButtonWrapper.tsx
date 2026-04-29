"use client";

import { use, useEffect, useState } from "react";
import FavoriteButton from "@/components/Items/FavoriteButton";
import { fetchUserFavorites } from "@/utils/api";
import { useAuthContext } from "@/contexts/AuthContext";

interface Props {
  itemId: number;
  initialFavoriteCountPromise: Promise<number | null>;
}

export default function FavoriteButtonServer({
  itemId,
  initialFavoriteCountPromise,
}: Props) {
  const { user, isLoading: authLoading } = useAuthContext();
  const initialFavoriteCount = use(initialFavoriteCountPromise);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setFavLoading(false);
      return;
    }
    fetchUserFavorites(user.id)
      .then((data) => {
        if (data !== null && Array.isArray(data)) {
          setIsFavorited(
            data.some((fav) => {
              const id = String(fav.item_id);
              if (id.includes("-")) {
                return Number(id.split("-")[0]) === itemId;
              }
              return Number(id) === itemId;
            }),
          );
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
      initialCount={initialFavoriteCount || 0}
    />
  );
}
