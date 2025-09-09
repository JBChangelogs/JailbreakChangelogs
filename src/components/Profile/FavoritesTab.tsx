"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Pagination,
  Chip,
  Button,
  Skeleton,
  Divider,
  Tooltip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import { PUBLIC_API_URL } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { formatRelativeDate, formatCustomDate } from "@/utils/timestamp";
import { getItemTypeColor } from "@/utils/badgeColors";
import { ItemDetails } from "@/types";

interface FavoriteItem {
  item_id: string;
  created_at: number;
  author: string;
  item?: {
    id: number;
    name?: string;
    type?: string;
    parent?: number;
    sub_name?: string;
    data?: {
      name: string;
      type: string;
    };
  };
}

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
}

export default function FavoritesTab({
  userId,
  currentUserId,
  settings,
}: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const favoritesPerPage = 9;

  // Check if favorites should be hidden
  const shouldHideFavorites =
    settings?.hide_favorites === 1 && currentUserId !== userId;

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        // Don't fetch favorites if they should be hidden
        if (shouldHideFavorites) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${PUBLIC_API_URL}/favorites/get?user=${userId}`,
        );

        if (!response.ok) {
          // Check if this is a 404 "No favorites found" response
          if (response.status === 404) {
            // This is not an actual error, just means the user has no favorites
            setFavorites([]);
            setLoading(false);
            return;
          }

          throw new Error(`Failed to fetch favorites: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          // Sort by most recently favorited first
          const sortedFavorites = data.sort(
            (a, b) => b.created_at - a.created_at,
          );

          // Fetch details for each favorited item
          const favoritesWithDetails = await Promise.all(
            sortedFavorites.map(async (favorite) => {
              try {
                // Check if this is a sub-item (contains a hyphen)
                const isSubItem = favorite.item_id.includes("-");
                let itemResponse;

                if (isSubItem) {
                  // For sub-items, use the sub-items endpoint
                  const [parentId] = favorite.item_id.split("-");
                  itemResponse = await fetch(
                    `${PUBLIC_API_URL}/items/get/sub?parent_id=${parentId}`,
                  );
                } else {
                  // For regular items, use the normal endpoint
                  itemResponse = await fetch(
                    `${PUBLIC_API_URL}/items/get?id=${favorite.item_id}`,
                  );
                }

                if (itemResponse.ok) {
                  const itemDetails: ItemDetails = await itemResponse.json();
                  return { ...favorite, details: { item: itemDetails } };
                }
                return favorite;
              } catch (err) {
                console.error(
                  `Error fetching details for item ${favorite.item_id}:`,
                  err,
                );
                return favorite;
              }
            }),
          );

          setFavorites(favoritesWithDetails);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch favorites",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFavorites();
    }
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
  const renderFavorite = (favorite: FavoriteWithDetails) => {
    // Handle sub-items (variants)
    const isSubItem = favorite.item_id.includes("-");

    let itemName = "";
    let itemType = "";
    let imageName = "";
    let itemUrl = "";

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
        return null;
      }
      itemName = itemData.name;
      itemType = itemData.type;
      imageName = itemName;
      // Create URL for regular item
      const baseName = itemName;
      itemUrl = `/item/${itemType.toLowerCase()}/${baseName}`;
    }

    // If we don't have a name or type, don't render the card
    if (!itemName || !itemType) {
      return null;
    }

    const isVideo = isVideoItem(imageName);
    const typeColor = getItemTypeColor(itemType);

    return (
      <Link
        key={`${favorite.item_id}-${favorite.created_at}`}
        href={itemUrl}
        className="group block"
      >
        <Box className="rounded-lg border border-[#2E3944] bg-[#212A31] p-3 shadow-sm transition-colors hover:border-[#5865F2]">
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
                <span className="text-muted font-medium transition-colors group-hover:text-blue-300">
                  {itemName}
                </span>
              </div>
              <div className="text-xs text-[#FFFFFF]">
                {itemType && (
                  <div className="mb-1">
                    <Chip
                      label={itemType}
                      size="small"
                      sx={{
                        backgroundColor: typeColor,
                        color: "#fff",
                        fontSize: "0.65rem",
                        height: "20px",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Divider sx={{ my: 1, backgroundColor: "#2E3944" }} />

          <div className="flex items-center justify-start text-xs">
            <Tooltip
              title={formatCustomDate(favorite.created_at)}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "#0F1419",
                    color: "#D3D9D4",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #2E3944",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "#0F1419",
                    },
                  },
                },
              }}
            >
              <span className="cursor-help text-[#FFFFFF]">
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
        <div className="rounded-lg border border-[#5865F2] bg-[#2E3944] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarIcon className="text-[#5865F2]" />
              <h2 className="text-muted text-lg font-semibold">
                Favorited Items
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, index) => (
              <Box
                key={index}
                className="rounded-lg border border-[#2E3944] bg-[#212A31] p-3 shadow-sm"
              >
                <div className="mb-2 flex items-center">
                  <div className="relative mr-3 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height="100%"
                      sx={{ bgcolor: "#2E3944" }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <Skeleton
                        variant="text"
                        width={120}
                        height={24}
                        sx={{ bgcolor: "#2E3944" }}
                      />
                    </div>
                    <div className="text-xs text-[#FFFFFF]">
                      <div className="mb-1">
                        <Skeleton
                          variant="rounded"
                          width={80}
                          height={20}
                          sx={{ bgcolor: "#2E3944" }}
                        />
                      </div>
                      <Skeleton
                        variant="text"
                        width={140}
                        height={16}
                        sx={{ bgcolor: "#2E3944" }}
                      />
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
        <div className="rounded-lg border border-[#5865F2] bg-[#2E3944] p-4">
          <div className="mb-3 flex items-center gap-2">
            <StarIcon className="text-[#5865F2]" />
            <h2 className="text-muted text-lg font-semibold">
              Favorited Items [{favorites.length}]
            </h2>
          </div>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (shouldHideFavorites) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-[#5865F2] bg-[#2E3944] p-4">
          <div className="mb-3 flex items-center gap-2">
            <StarIcon className="text-[#5865F2]" />
            <h2 className="text-muted text-lg font-semibold">
              Favorited Items
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[#FFFFFF]">
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
      <div className="rounded-lg border border-[#5865F2] bg-[#2E3944] p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <StarIcon className="text-[#5865F2]" />
            <h2 className="text-muted text-lg font-semibold">
              Favorited Items [{favorites.length}]
            </h2>
          </div>
          <Button
            variant="outlined"
            onClick={() =>
              setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
            }
            startIcon={
              sortOrder === "newest" ? (
                <ArrowDownIcon className="h-4 w-4" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )
            }
            size="small"
            sx={{
              borderColor: "#5865F2",
              color: "#5865F2",
              backgroundColor: "#212A31",
              "&:hover": {
                borderColor: "#4752C4",
                backgroundColor: "#2B2F4C",
              },
            }}
          >
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        {favorites.length === 0 ? (
          <p className="text-[#FFFFFF] italic">No favorites yet</p>
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
                  color="primary"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "#D3D9D4",
                    },
                    "& .Mui-selected": {
                      backgroundColor: "#5865F2 !important",
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
