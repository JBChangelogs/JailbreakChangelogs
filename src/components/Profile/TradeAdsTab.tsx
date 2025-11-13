"use client";

import { useState } from "react";
import {
  CircularProgress,
  Box,
  Pagination,
  Chip,
  Skeleton,
  Tooltip,
} from "@mui/material";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import Image from "next/image";
import Link from "next/link";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/media/images";
import { getCategoryColor } from "@/utils/ui/categoryIcons";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

interface TradeItem {
  id: number;
  name: string;
  type: string;
  creator: string;
  is_seasonal: number;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number;
  duped_owners: string;
  notes: string;
  demand: string;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
}

interface TradeAd {
  id: number;
  requesting: TradeItem[];
  offering: TradeItem[];
  author: string;
  created_at: number;
  expires: number | null;
  expired: number;
  status: string;
}

interface TradeAdsTabProps {
  userId: string;
  tradeAds?: TradeAd[];
  isLoadingAdditionalData?: boolean;
  isOwnProfile?: boolean;
}

export default function TradeAdsTab({
  tradeAds: propTradeAds = [],
  isLoadingAdditionalData = false,
  isOwnProfile = false,
}: TradeAdsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 3;
  const tradeAds = propTradeAds;
  const loading = false;
  const error = null;
  const TradeAdItem = ({ ad }: { ad: TradeAd }) => {
    const createdTime = useOptimizedRealTimeRelativeDate(
      ad.created_at,
      `trade-ad-created-${ad.id}`,
    );
    const expiresTime = useOptimizedRealTimeRelativeDate(
      ad.expires,
      `trade-ad-expires-${ad.id}`,
    );

    return renderTradeAd({ ...ad, createdTime, expiresTime });
  };
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };
  const indexOfLastAd = currentPage * adsPerPage;
  const indexOfFirstAd = indexOfLastAd - adsPerPage;
  const currentAds = tradeAds.slice(indexOfFirstAd, indexOfLastAd);
  const renderTradeItem = (
    item: TradeItem | { data: TradeItem; sub_name?: string },
    totalItems: number,
  ) => {
    // Handle both direct item data and nested data structure
    const itemData = "data" in item ? item.data : item;
    const isVideo = isVideoItem(itemData.name);
    const isVariant = "data" in item && item.sub_name;
    const displayName = isVariant
      ? `${itemData.name} [${item.sub_name}]`
      : itemData.name;
    const itemUrl = isVariant
      ? `/item/${itemData.type.toLowerCase()}/${itemData.name}?variant=${item.sub_name}`
      : `/item/${itemData.type.toLowerCase()}/${itemData.name}`;

    return (
      <div
        key={itemData.id}
        className="bg-primary-bg border-border-primary hover:border-border-focus rounded-lg border p-3 shadow-sm transition-colors"
      >
        <div className="mb-2 flex items-center">
          <div className="relative mr-3 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
            {isVideo ? (
              <video
                src={getVideoPath(itemData.type, itemData.name)}
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
                src={getItemImagePath(itemData.type, itemData.name)}
                alt={displayName}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              {isLoadingAdditionalData ? (
                <Skeleton variant="text" width="80%" height={20} />
              ) : (
                <Link
                  href={itemUrl}
                  className="text-primary-text hover:text-button-info font-medium transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </div>
            <div className="text-secondary-text text-xs">
              <div className="mb-1">
                {isLoadingAdditionalData ? (
                  <Skeleton variant="rounded" width={80} height={20} />
                ) : (
                  <Chip
                    label={itemData.type}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: getCategoryColor(itemData.type) + "20", // Add 20% opacity
                      borderColor: getCategoryColor(itemData.type),
                      color: "var(--color-primary-text)",
                      fontSize: "0.65rem",
                      height: "20px",
                      fontWeight: "medium",
                      "&:hover": {
                        borderColor: getCategoryColor(itemData.type),
                        backgroundColor: getCategoryColor(itemData.type) + "30", // Slightly more opacity on hover
                      },
                    }}
                  />
                )}
              </div>
              <div className="space-y-1">
                {totalItems > 1 && (
                  <p className="text-secondary-text">
                    +{totalItems - 1} other item
                    {totalItems - 1 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTradeAd = (
    ad: TradeAd & { createdTime: string; expiresTime: string },
  ) => {
    return (
      <div
        key={ad.id}
        className="border-border-primary bg-secondary-bg/30 mb-6 rounded-lg border p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SwapHorizIcon className="text-button-info h-6 w-6" />
            <Link
              href={`/trading/ad/${ad.id}`}
              className="text-primary-text hover:text-button-info text-xl font-bold transition-colors"
            >
              Trade Ad #{ad.id}
            </Link>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-sm font-medium ${
              ad.status === "Pending"
                ? "bg-button-info/10 text-primary-text border-button-info/20"
                : ad.status === "Completed"
                  ? "bg-status-success/10 text-status-success border-status-success/20"
                  : ad.status === "Expired"
                    ? "bg-status-error/10 text-status-error border-status-error/20"
                    : "bg-secondary-text/10 text-secondary-text border-secondary-text/20"
            }`}
          >
            {ad.status}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Offering Section */}
          <div className="border-status-success/20 bg-status-success/10 rounded-lg border p-4">
            <h3 className="text-status-success mb-4 text-lg font-bold">
              Offering
            </h3>
            {ad.offering.length > 0 ? (
              renderTradeItem(ad.offering[0], ad.offering.length)
            ) : (
              <p className="text-secondary-text italic">No items offered</p>
            )}
          </div>

          {/* Requesting Section */}
          <div className="border-status-error/20 bg-status-error/10 rounded-lg border p-4">
            <h3 className="text-status-error mb-4 text-lg font-bold">
              Requesting
            </h3>
            {ad.requesting.length > 0 ? (
              renderTradeItem(ad.requesting[0], ad.requesting.length)
            ) : (
              <p className="text-secondary-text italic">No items requested</p>
            )}
          </div>
        </div>

        <div className="border-border-primary text-secondary-text mt-6 flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
          <Tooltip
            title={formatCustomDate(ad.created_at)}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px var(--color-card-shadow)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <span className="cursor-help">Created {ad.createdTime}</span>
          </Tooltip>
          {ad.expires && (
            <>
              <span className="text-tertiary-text">|</span>
              <Tooltip
                title={formatCustomDate(ad.expires)}
                placement="top"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px var(--color-card-shadow)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <span className="cursor-help">Expires {ad.expiresTime}</span>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress sx={{ color: "var(--color-button-info)" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-primary rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <SwapHorizIcon className="text-button-info" />
            <h2 className="text-primary-text text-lg font-semibold">
              Trade Ads
            </h2>
          </div>
          <p className="text-status-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-border-primary rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <SwapHorizIcon className="text-button-info" />
          <h2 className="text-primary-text text-lg font-semibold">
            Trade Ads [{tradeAds.length}]
          </h2>
        </div>

        {tradeAds.length === 0 ? (
          <div className="p-8 text-center">
            <SwapHorizIcon className="text-button-info mx-auto mb-4 h-12 w-12" />
            <h3 className="text-primary-text mb-2 text-xl font-semibold">
              {isOwnProfile
                ? "You have not posted any trade ads."
                : "No trade ads available."}
            </h3>
            {isOwnProfile && (
              <Link
                href="/trading"
                className="text-form-button-text border-button-info bg-button-info hover:bg-button-info-hover mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                Create Trade Ad
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentAds.map((ad) => (
                <TradeAdItem key={ad.id} ad={ad} />
              ))}
            </div>

            {/* Pagination controls */}
            {tradeAds.length > adsPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  count={Math.ceil(tradeAds.length / adsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "var(--color-primary-text)",
                      "&.Mui-selected": {
                        backgroundColor: "var(--color-button-info)",
                        color: "var(--color-form-button-text)",
                        "&:hover": {
                          backgroundColor: "var(--color-button-info-hover)",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "var(--color-quaternary-bg)",
                      },
                    },
                    "& .MuiPaginationItem-icon": {
                      color: "var(--color-primary-text)",
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
