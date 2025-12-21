"use client";

import { useState, useEffect } from "react";
import { Box, Chip, Skeleton, Divider } from "@mui/material";
import { Pagination } from "@/components/ui/Pagination";

import { Tooltip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import Link from "next/link";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { getCategoryColor } from "@/utils/categoryIcons";
import { formatRelativeDate, formatCustomDate } from "@/utils/timestamp";
import { ItemDetails, FavoriteItem } from "@/types";

interface FavoriteWithDetails extends FavoriteItem {
  details?: {
    item: ItemDetails;
  };
}

interface FavoritesTabProps {
  userId: string;
  currentUserId?: string | null;
  settings?: {
    hide_favorites?: number;
  };
  favorites?: FavoriteItem[];
  favoriteItemDetails?: Record<string, unknown>;
  isLoadingAdditionalData?: boolean;
  sharedItemDetails?: Record<string, unknown>;
}

export default function FavoritesTab({
  userId,
  currentUserId,
  settings,
  favorites: serverFavorites = [],
  favoriteItemDetails = {},
  isLoadingAdditionalData = false,
  sharedItemDetails = {},
}: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [loading, setLoading] = useState(
    !serverFavorites.length && isLoadingAdditionalData,
  );
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const favoritesPerPage = 9;

  // Check if favorites should be hidden
  const shouldHideFavorites =
    settings?.hide_favorites === 1 && currentUserId !== userId;

  useEffect(() => {
    const processFavorites = () => {
      try {
        setLoading(false);

        // Don't show favorites if they should be hidden
        if (shouldHideFavorites) {
          setFavorites([]);
          return;
        }

        if (Array.isArray(serverFavorites) && serverFavorites.length > 0) {
          // Process server-side favorites with item details
          // Use shared cache first, then fall back to favoriteItemDetails
          const favoritesWithDetails = serverFavorites.map((favorite) => {
            const itemDetails =
              sharedItemDetails[favorite.item_id] ||
              favoriteItemDetails[favorite.item_id];
            return {
              ...favorite,
              details: itemDetails
                ? { item: itemDetails as ItemDetails }
                : undefined,
            };
          });

          setFavorites(favoritesWithDetails);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("Error processing favorites:", err);
        setError(
          err instanceof Error ? err.message : "Failed to process favorites",
        );
      }
    };

    if (userId) {
      processFavorites();
    }
  }, [
    userId,
    shouldHideFavorites,
    serverFavorites,
    favoriteItemDetails,
    sharedItemDetails,
  ]);

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
  const renderFavorite = (favorite: FavoriteWithDetails) => {
    // Handle sub-items (variants)
    const isSubItem = favorite.item_id.includes("-");

    let itemName = "";
    let itemType = "";
    let imageName = "";
    let itemUrl = "";
    let isLoadingItem = false;

    if (isSubItem) {
      // For sub-items, use the data directly from favorite.item
      const itemData = favorite.item;
      if (!itemData?.data) {
        return null;
      }
      itemName = `${itemData.data.name}${itemData.sub_name ? ` (${itemData.sub_name})` : ""}`;
      itemType = itemData.data.type;
      // For sub-items, use the base name without the year for the image
      imageName = itemData.data.name;
      // Create URL for sub-item
      const baseName = itemData.data.name;
      itemUrl = `/item/${itemType.toLowerCase()}/${baseName}?variant=${itemData.sub_name}`;
    } else {
      // For regular items, use the details.item data
      const itemData = favorite.details?.item;
      if (!itemData?.name || !itemData?.type) {
        // Check if we're still loading additional data
        if (isLoadingAdditionalData) {
          isLoadingItem = true;
          itemName = ""; // Will show skeleton
          itemType = "Loading...";
          imageName = "";
          itemUrl = "#";
        } else {
          return null;
        }
      } else {
        itemName = itemData.name;
        itemType = itemData.type;
        imageName = itemName;
        // Create URL for regular item
        const baseName = itemName;
        itemUrl = `/item/${itemType.toLowerCase()}/${baseName}`;
      }
    }

    // If we don't have a name or type and we're not loading, don't render the card
    if (!itemName && !isLoadingItem) {
      return null;
    }

    const isVideo = isVideoItem(imageName);

    return (
      <Link
        key={`${favorite.item_id}-${favorite.created_at}`}
        href={itemUrl}
        className="group block"
      >
        <Box className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-3 shadow-sm transition-colors">
          <div className="mb-2 flex items-center">
            <div className="relative mr-3 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
              {isVideo ? (
                <video
                  src={getVideoPath(itemType, imageName)}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay
                  onError={(e) => {
                    console.log("Video error:", e);
                  }}
                  onAbort={(e) => {
                    console.log("Video aborted by browser power saving:", e);
                  }}
                  onPause={(e) => {
                    console.log("Video paused:", e);
                  }}
                  onPlay={(e) => {
                    console.log("Video play attempted:", e);
                  }}
                />
              ) : (
                <Image
                  src={getItemImagePath(
                    itemType,
                    imageName,
                    true,
                    false,
                    "light",
                  )}
                  alt={itemName}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                {isLoadingItem ? (
                  <Skeleton variant="text" width="80%" height={20} />
                ) : (
                  <span className="text-primary-text group-hover:text-button-info font-medium transition-colors">
                    {itemName}
                  </span>
                )}
              </div>
              <div className="text-secondary-text text-xs">
                {itemType && (
                  <div className="mb-1">
                    {isLoadingItem ? (
                      <Skeleton variant="rounded" width={80} height={20} />
                    ) : (
                      <Chip
                        label={itemType}
                        size="small"
                        variant="outlined"
                        sx={{
                          backgroundColor: getCategoryColor(itemType) + "20", // Add 20% opacity
                          borderColor: getCategoryColor(itemType),
                          color: "var(--color-primary-text)",
                          fontSize: "0.65rem",
                          height: "20px",
                          fontWeight: "medium",
                          "&:hover": {
                            borderColor: getCategoryColor(itemType),
                            backgroundColor: getCategoryColor(itemType) + "30", // Slightly more opacity on hover
                          },
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Divider
            sx={{ my: 1, backgroundColor: "var(--color-border-primary)" }}
          />

          <div className="flex items-center justify-start text-xs">
            <Tooltip
              title={formatCustomDate(favorite.created_at)}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-primary-bg)",
                    color: "var(--color-secondary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "var(--color-card-shadow)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-primary-bg)",
                    },
                  },
                },
              }}
            >
              <span className="text-secondary-text cursor-help">
                Favorited {formatRelativeDate(favorite.created_at)}
              </span>
            </Tooltip>
          </div>
        </Box>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-border-primary rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarIcon className="text-button-info" />
              <h2 className="text-primary-text text-lg font-semibold">
                Favorited Items
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, index) => (
              <Box key={index} className="rounded-lg border p-3 shadow-sm">
                <div className="mb-2 flex items-center">
                  <div className="relative mr-3 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height="100%"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <Skeleton variant="text" width={120} height={24} />
                    </div>
                    <div className="text-secondary-text text-xs">
                      <div className="mb-1">
                        <Skeleton variant="rounded" width={80} height={20} />
                      </div>
                      <Skeleton variant="text" width={140} height={16} />
                    </div>
                  </div>
                </div>
              </Box>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-primary rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <StarIcon className="text-button-info" />
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
        <div className="border-border-primary rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <StarIcon className="text-button-info" />
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
      <div className="border-border-primary rounded-lg border p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <StarIcon className="text-button-info" />
            <h2 className="text-primary-text text-lg font-semibold">
              Favorited Items [{favorites.length}]
            </h2>
          </div>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
            }
            className="border-border-primary bg-button-info text-form-button-text hover:border-border-focus hover:bg-button-info-hover flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
          >
            {sortOrder === "newest" ? (
              <Icon
                icon="heroicons-outline:arrow-down"
                className="h-4 w-4"
                inline={true}
              />
            ) : (
              <Icon
                icon="heroicons-outline:arrow-up"
                className="h-4 w-4"
                inline={true}
              />
            )}
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </button>
        </div>

        {favorites.length === 0 ? (
          <p className="text-primary-text italic">No favorites yet</p>
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
