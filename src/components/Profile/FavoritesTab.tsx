"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

function FavoriteCardSkeleton({ preview = false }: { preview?: boolean }) {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm">
      <div className={preview ? "space-y-3" : "mb-2 flex items-center"}>
        <div
          className={
            preview
              ? "bg-quaternary-bg aspect-video w-full rounded-lg"
              : "bg-quaternary-bg mr-3 h-16 w-16 shrink-0 rounded-md md:h-18 md:w-32"
          }
        />
        <div className="min-w-0 flex-1">
          <div className="bg-quaternary-bg mb-2 h-4 w-3/4 rounded" />
          <div className="bg-quaternary-bg h-6 w-20 rounded-lg" />
        </div>
      </div>
      <div className="bg-quaternary-bg mt-2 h-3 w-32 rounded" />
    </div>
  );
}

function FavoritesTabSkeleton({ preview = false }: { preview?: boolean }) {
  return (
    <div className="animate-pulse">
      <div
        className={
          preview
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
            : "grid grid-cols-1 gap-4 md:grid-cols-2"
        }
      >
        {Array.from({ length: preview ? 3 : 9 }).map((_, i) => (
          <FavoriteCardSkeleton key={i} preview={preview} />
        ))}
      </div>
    </div>
  );
}

interface FavoritesTabProps {
  preview?: boolean;
  onViewAll?: () => void;
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
  preview = false,
  onViewAll,
}: FavoritesTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const favoritesPerPage = preview ? 6 : 9;

  const shouldHideFavorites =
    settings?.hide_favorites === true && currentUserId !== userId;

  const favoritesQuery = useQuery({
    queryKey: ["profile", userId, "favorites"],
    queryFn: ({ signal }) => fetchFavoritesData(userId, signal),
    enabled: !shouldHideFavorites,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const favorites: FavoriteItem[] = favoritesQuery.data ?? [];
  const loading = !shouldHideFavorites && favoritesQuery.isPending;
  const error =
    !favoritesQuery.data && favoritesQuery.isError
      ? "Failed to load favorites"
      : null;

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

  if (
    preview &&
    (shouldHideFavorites || (!loading && !error && favorites.length === 0))
  )
    return null;

  // Render a favorite item
  const renderFavorite = (favorite: FavoriteItem) => {
    const item = favorite.item;
    if (!item?.name || !item?.type) return null;
    const itemName = item.name;
    const itemType = item.type;
    const imageName = itemName;
    const itemUrl = `/item/${encodeURIComponent(itemType)}/${encodeURIComponent(itemName)}`;

    const isVideo = isVideoItem(imageName);

    return (
      <Link
        key={`${favorite.item?.id}-${favorite.created_at}`}
        href={itemUrl}
        className="group block"
      >
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm transition-colors">
          <div className={preview ? "space-y-3" : "mb-2 flex items-center"}>
            <div
              className={
                preview
                  ? "bg-quaternary-bg relative aspect-video w-full overflow-hidden rounded-lg"
                  : "relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32"
              }
            >
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
                  sizes={
                    preview
                      ? "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                      : "128px"
                  }
                  className="object-cover"
                  onError={handleImageError}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <span className="text-primary-text group-hover:text-link font-medium wrap-break-word transition-colors">
                  {itemName}
                </span>
              </div>
              <div className="text-secondary-text text-xs">
                {itemType && (
                  <div className="mb-1">
                    <span
                      className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                      style={{
                        borderColor: getCategoryColor(itemType),
                        backgroundColor: `${getCategoryColor(itemType)}22`,
                      }}
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
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <div className="bg-quaternary-bg mb-4 h-6 w-36 animate-pulse rounded" />
        <FavoritesTabSkeleton preview={preview} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              {preview ? "Favorite items" : "Favorited Items"}{" "}
              <span className="text-secondary-text ml-1 text-sm font-normal">
                {favorites.length}
              </span>
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
        <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
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
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              {preview ? "Favorite items" : "Favorited Items"}{" "}
              <span className="text-secondary-text ml-1 text-sm font-normal">
                {favorites.length}
              </span>
            </h2>
          </div>
          {preview ? (
            <Button variant="link" size="sm" onClick={onViewAll}>
              View all <Icon icon="heroicons:chevron-right" />
            </Button>
          ) : (
            favorites.length > 0 && (
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
                  <Icon
                    icon="heroicons-outline:arrow-down"
                    className="h-4 w-4"
                  />
                ) : (
                  <Icon icon="heroicons-outline:arrow-up" className="h-4 w-4" />
                )}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </Button>
            )
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
            <div
              className={
                preview
                  ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
                  : "mb-4 grid grid-cols-1 gap-4 md:grid-cols-2"
              }
            >
              {currentFavorites.map(renderFavorite)}
            </div>

            {/* Pagination controls */}
            {!preview && favorites.length > favoritesPerPage && (
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
