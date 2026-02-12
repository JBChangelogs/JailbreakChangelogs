"use client";

import { useState } from "react";
import { CircularProgress, Box, Chip, Skeleton } from "@mui/material";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { formatCustomDate } from "@/utils/timestamp";
import Image from "next/image";
import Link from "next/link";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { getCategoryColor } from "@/utils/categoryIcons";
import { Icon } from "@/components/ui/IconWrapper";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-button-info/10 text-primary-text border-button-info/20";
    case "Completed":
      return "bg-status-success/10 text-primary-text border-status-success/20";
    case "Expired":
      return "bg-status-error/10 text-status-error border-status-error/20";
    default:
      return "bg-secondary-text/10 text-secondary-text border-secondary-text/20";
  }
};

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
  const renderTradeItem = (item: TradeItem, totalItems: number) => {
    const isVideo = isVideoItem(item.name);
    const displayName = item.name;
    const itemUrl = `/item/${item.type.toLowerCase()}/${item.name}`;

    return (
      <div
        key={item.id}
        className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm transition-colors"
      >
        <div className="mb-2 flex items-center">
          <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
            {isVideo ? (
              <video
                src={getVideoPath(item.type, item.name)}
                className="h-full w-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              <Image
                src={getItemImagePath(item.type, item.name)}
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
                  className="text-primary-text hover:text-link font-medium transition-colors"
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
                    label={item.type}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
                      borderColor: getCategoryColor(item.type),
                      color: "var(--color-primary-text)",
                      fontSize: "0.65rem",
                      height: "20px",
                      fontWeight: "medium",
                      "&:hover": {
                        borderColor: getCategoryColor(item.type),
                        backgroundColor: getCategoryColor(item.type) + "30", // Slightly more opacity on hover
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
        className="border-border-card bg-tertiary-bg mb-6 rounded-lg border p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/trading/ad/${ad.id}`}
              className="text-primary-text hover:text-button-info text-xl font-bold transition-colors"
            >
              Trade Ad #{ad.id}
            </Link>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(ad.status)}`}
          >
            {ad.status}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Offering Section */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <h3 className="text-primary-text mb-4 text-lg font-bold">
              Offering
            </h3>
            {ad.offering.length > 0 ? (
              renderTradeItem(ad.offering[0], ad.offering.length)
            ) : (
              <p className="text-secondary-text italic">No items offered</p>
            )}
          </div>

          {/* Requesting Section */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <h3 className="text-primary-text mb-4 text-lg font-bold">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">Created {ad.createdTime}</span>
            </TooltipTrigger>
            <TooltipContent>{formatCustomDate(ad.created_at)}</TooltipContent>
          </Tooltip>
          {ad.expires && (
            <>
              <span className="text-tertiary-text">|</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">Expires {ad.expiresTime}</span>
                </TooltipTrigger>
                <TooltipContent>{formatCustomDate(ad.expires)}</TooltipContent>
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
          <h2 className="text-primary-text text-lg font-semibold">
            Trade Ads [{tradeAds.length}]
          </h2>
        </div>

        {tradeAds.length === 0 ? (
          <div className="p-8 text-center">
            <Icon
              icon="heroicons:arrows-right-left"
              className="text-button-info mx-auto mb-4 h-12 w-12"
            />
            <h3 className="text-primary-text mb-2 text-xl font-semibold">
              {isOwnProfile
                ? "You have not posted any trade ads."
                : "No trade ads available."}
            </h3>
            {isOwnProfile && (
              <Button asChild variant="default" size="sm" className="mt-4">
                <Link href="/trading">Create Trade Ad</Link>
              </Button>
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
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
