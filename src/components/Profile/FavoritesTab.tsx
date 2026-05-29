"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect } from "react";

const log = createLogger("UI");
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import Link from "next/link";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import { getCategoryColor } from "@/utils/items/categoryIcons";
import {
  formatRelativeDate,
  formatCustomDate,
} from "@/utils/helpers/timestamp";
import { FavoriteItem } from "@/types";
import { fetchFavoritesData } from "@/app/users/[id]/actions";

function FavoriteCardSkeleton() {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm">
      <div className="mb-2 flex items-center">
        <div className="bg-quaternary-bg mr-3 h-16 w-16 shrink-0 rounded-md md:h-18 md:w-32" />
        <div className="min-w-0 flex-1">
          <div className="bg-quaternary-bg mb-2 h-4 w-3/4 rounded" />
          <div className="bg-quaternary-bg h-6 w-20 rounded-lg" />
        </div>
      </div>
      <div className="bg-quaternary-bg mt-2 h-3 w-32 rounded" />
    </div>
  );
}

function FavoritesTabSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <FavoriteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

interface FavoritesTabProps {
  userId: string;
  currentUserId?: string | null;
  settings?: {
    hide_favorites?: boolean;
  };
}

export default function FavoritesTab({
  userId,
  currentUserId,
  settings,
}: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const favoritesPerPage = 9;

  const shouldHideFavorites =
    settings?.hide_favorites === true && currentUserId !== userId;

  useEffect(() => {
    if (shouldHideFavorites) {
      setLoading(false);
      return;
    }
    fetchFavoritesData(userId)
      .then((data) => setFavorites(data))
      .catch((err) => {
        log.error("Error fetching favorites", err);
        setError("Failed to load favorites");
      })
      .finally(() => setLoading(false));
  }, [userId, shouldHideFavorites]);

  // Sort favorites based on selected order
  const sortedFavorites = [...favorites].sort((a, b) => {
    return sortOrder === "newest"
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Change page
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
    // Remove the scroll behavior
  };

  // Get current page favorites
  const indexOfLastFavorite = currentPage * favoritesPerPage;
  const indexOfFirstFavorite = indexOfLastFavorite - favoritesPerPage;
  const currentFavorites = sortedFavorites.slice(
    indexOfFirstFavorite,
    indexOfLastFavorite,
  );

  // Render a favorite item
  const renderFavorite = (favorite: FavoriteItem) => {
    const isSubItem = !!favorite.item?.data;

    let itemName = "";
    let itemType = "";
    let imageName = "";
    let itemUrl = "";

    if (isSubItem) {
      const itemData = favorite.item;
      if (!itemData?.data) {
        return null;
      }
      itemName = `${itemData.data.name}${itemData.sub_name ? ` (${itemData.sub_name})` : ""}`;
      itemType = itemData.data.type;
      imageName = itemData.data.name;
      itemUrl = `/item/${encodeURIComponent(itemType)}/${encodeURIComponent(itemData.data.name)}?variant=${itemData.sub_name}`;
    } else {
      const itemData = favorite.item;
      if (!itemData?.name || !itemData?.type) {
        return null;
      } else {
        itemName = itemData.name;
        itemType = itemData.type;
        imageName = itemName;
        itemUrl = `/item/${encodeURIComponent(itemType)}/${encodeURIComponent(itemName)}`;
      }
    }

    if (!itemName) return null;

    const isVideo = isVideoItem(imageName);

    return (
      <Link
        key={`${favorite.item?.id}-${favorite.created_at}`}
        href={itemUrl}
        className="group block"
      >
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm transition-colors">
          <div className="mb-2 flex items-center">
            <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
              {isVideo ? (
                <video
                  src={getVideoPath(itemType, imageName)}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay
                />
              ) : (
                <Image
                  src={getItemImagePath(itemType, imageName, true, false)}
                  alt={itemName}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <span className="text-primary-text group-hover:text-link font-medium transition-colors">
                  {itemName}
                </span>
              </div>
              <div className="text-secondary-text text-xs">
                {itemType && (
                  <div className="mb-1">
                    <span
                      className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                      style={{ borderColor: getCategoryColor(itemType) }}
                    >
                      {itemType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-start text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-secondary-text cursor-help">
                  Favorited {formatRelativeDate(favorite.created_at)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {formatCustomDate(favorite.created_at)}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <div className="bg-quaternary-bg mb-4 h-6 w-36 animate-pulse rounded" />
        <FavoritesTabSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Favorited Items [{favorites.length}]
            </h2>
          </div>
          <p className="text-status-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (shouldHideFavorites) {
    return (
      <div className="space-y-6">
        <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Favorited Items
            </h2>
          </div>
          <div className="text-primary-text flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p>This user has chosen to keep their favorites private</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="favorites-section">
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Favorited Items [{favorites.length}]
            </h2>
          </div>
          {favorites.length > 0 && (
            <Button
              onClick={() =>
                setSortOrder((prev) =>
                  prev === "newest" ? "oldest" : "newest",
                )
              }
              variant="default"
              size="sm"
              className="flex items-center gap-1"
            >
              {sortOrder === "newest" ? (
                <Icon icon="heroicons-outline:arrow-down" className="h-4 w-4" />
              ) : (
                <Icon icon="heroicons-outline:arrow-up" className="h-4 w-4" />
              )}
              {sortOrder === "newest" ? "Newest First" : "Oldest First"}
            </Button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="py-6 text-center">
            <Image
              src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
              alt="No favorites"
              width={160}
              height={128}
              className="mx-auto mb-4"
            />
            <p className="text-primary-text mb-1 font-semibold">
              No Favorites Yet
            </p>
            <p className="text-secondary-text mx-auto max-w-sm text-sm leading-relaxed">
              {currentUserId === userId
                ? "You haven't favorited any items yet."
                : "This user hasn't favorited any items yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentFavorites.map(renderFavorite)}
            </div>

            {/* Pagination controls */}
            {favorites.length > favoritesPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  count={Math.ceil(favorites.length / favoritesPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
