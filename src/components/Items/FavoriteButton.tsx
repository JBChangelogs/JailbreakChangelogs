"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Icon } from "@/components/ui/IconWrapper";

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
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoriteCount, setFavoriteCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const idString = String(itemId);
      const response = await fetch(
        `/api/favorites/${isFavorited ? "remove" : "add"}`,
        {
          method: isFavorited ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({ item_id: idString }),
        },
      );

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
      console.error("Error updating favorite status:", error);
      toast.error("Failed to update favorite status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFavoriteClick}
      disabled={isLoading}
      className="bg-secondary-bg/80 border-border-primary hover:border-border-focus hover:bg-secondary-bg flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1.5 transition-opacity disabled:opacity-50"
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorited ? (
        <Icon
          icon="mdi:heart"
          className="h-5 w-5"
          style={{ color: "#ff5a79" }}
        />
      ) : (
        <Icon icon="mdi:heart-outline" className="text-primary-text h-5 w-5" />
      )}
      {favoriteCount > 0 && (
        <span className="text-primary-text text-sm">{favoriteCount}</span>
      )}
    </button>
  );
}
