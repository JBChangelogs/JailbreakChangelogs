"use client";

import { createLogger } from "@/services/logger";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { useAuthContext } from "@/contexts/AuthContext";
import type { FavoriteItem } from "@/types";

const log = createLogger("UI");
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FavoriteButtonProps {
  itemId: number;
  isAuthenticated: boolean;
  initialIsFavorited: boolean;
  initialCount: number;
  item?: FavoriteItem["item"];
}

export default function FavoriteButton({
  itemId,
  isAuthenticated,
  initialIsFavorited,
  initialCount,
  item,
}: FavoriteButtonProps) {
  const { setLoginModal, user } = useAuthContext();
  const queryClient = useQueryClient();
  const isFavorited = initialIsFavorited;
  const favoriteCount = initialCount;
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.info(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      setLoginModal({ open: true });
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const idString = String(itemId);
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/me/favorites/${encodeURIComponent(idString)}`,
      );
      const response = await fetch(url, {
        method: isFavorited ? "DELETE" : "PUT",
        headers,
        credentials: "include",
      });

      if (response.ok) {
        const favoritesKey = ["user-favorites", user?.id];
        const countKey = ["item-favorites", itemId];
        await Promise.all([
          queryClient.cancelQueries({ queryKey: favoritesKey }),
          queryClient.cancelQueries({ queryKey: countKey }),
        ]);
        const favoriteItem =
          item ??
          queryClient.getQueryData<FavoriteItem["item"]>([
            "item",
            "id",
            itemId,
          ]);
        queryClient.setQueryData<FavoriteItem[]>(
          favoritesKey,
          (previous = []) => {
            const remaining = previous.filter(
              (favorite) => favorite.item.id !== itemId,
            );
            return !isFavorited && favoriteItem
              ? [
                  ...remaining,
                  {
                    created_at: Date.now(),
                    item: {
                      id: itemId,
                      name: favoriteItem.name,
                      type: favoriteItem.type,
                    },
                  },
                ]
              : remaining;
          },
        );
        queryClient.setQueryData<
          number | { count: number; [key: string]: unknown }
        >(countKey, (previous) => {
          const current =
            typeof previous === "number"
              ? previous
              : (previous?.count ?? favoriteCount);
          const next = Math.max(0, current + (isFavorited ? -1 : 1));
          return previous && typeof previous === "object"
            ? { ...previous, count: next }
            : next;
        });
        if (user?.id) {
          void queryClient.invalidateQueries({ queryKey: favoritesKey });
          void queryClient.invalidateQueries({
            queryKey: ["profile", user.id, "favorites"],
          });
        }
        void queryClient.invalidateQueries({ queryKey: countKey });
        toast.success(
          isFavorited ? "Removed from favorites" : "Added to favorites",
        );
      } else {
        toast.error("Failed to update favorite status");
      }
    } catch (error) {
      log.error("Error updating favorite status", error);
      toast.error("Failed to update favorite status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className="bg-secondary-bg/80 border-border-card hover:border-border-focus hover:bg-secondary-bg flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1.5 transition-opacity disabled:opacity-50"
        >
          {isFavorited ? (
            <Icon
              icon="mdi:heart"
              className="h-5 w-5"
              style={{ color: "#ff5a79" }}
            />
          ) : (
            <Icon
              icon="mdi:heart-outline"
              className="text-primary-text h-5 w-5"
            />
          )}
          {favoriteCount > 0 && (
            <span className="text-primary-text text-sm">{favoriteCount}</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {isFavorited ? "Remove from favorites" : "Add to favorites"}
      </TooltipContent>
    </Tooltip>
  );
}
