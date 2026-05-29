"use client";

import { createLogger } from "@/services/logger";
import { useState } from "react";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { useAuthContext } from "@/contexts/AuthContext";

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
}

export default function FavoriteButton({
  itemId,
  isAuthenticated,
  initialIsFavorited,
  initialCount,
}: FavoriteButtonProps) {
  const { setLoginModal } = useAuthContext();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoriteCount, setFavoriteCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error(
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
        "/favorites",
      );
      const response = await fetch(url, {
        method: isFavorited ? "DELETE" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: idString }),
        credentials: "include",
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
        setFavoriteCount((prev) => (isFavorited ? prev - 1 : prev + 1));
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
