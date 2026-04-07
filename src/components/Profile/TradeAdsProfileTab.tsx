"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TradeAd } from "@/types/trading";
import { useMemo, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { TradeAdCard } from "@/components/trading/TradeAdCard";
import { Icon } from "@/components/ui/IconWrapper";

interface User {
  id: string;
  roblox_id?: string | null;
}

interface TradeAdsProfileTabProps {
  user: User;
  tradeAds?: TradeAd[];
  isLoadingAdditionalData?: boolean;
  isOwnProfile?: boolean;
  currentUserId?: string | null;
}

export default function TradeAdsProfileTab({
  tradeAds = [],
  isLoadingAdditionalData = false,
  isOwnProfile = false,
  currentUserId = null,
}: TradeAdsProfileTabProps) {
  const [page, setPage] = useState(1);
  const adsPerPage = 9;

  const sortedTradeAds = useMemo(
    () => [...tradeAds].sort((a, b) => b.created_at - a.created_at),
    [tradeAds],
  );
  const totalPages = Math.max(1, Math.ceil(sortedTradeAds.length / adsPerPage));
  const startIndex = (page - 1) * adsPerPage;
  const currentPageAds = sortedTradeAds.slice(
    startIndex,
    startIndex + adsPerPage,
  );

  return (
    <div className="mt-6 mb-8">
      {isLoadingAdditionalData ? (
        <div className="mx-auto max-w-lg p-6 text-center">
          <p className="text-secondary-text text-sm">Loading trade ads...</p>
        </div>
      ) : sortedTradeAds.length === 0 ? (
        <div className="mx-auto max-w-lg p-8 text-center">
          <Icon
            icon="heroicons:arrows-right-left"
            className="text-button-info mx-auto mb-4 h-12 w-12"
          />
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            {isOwnProfile
              ? "You have no active trade ads."
              : "This user has no active trade ads."}
          </h3>
          {isOwnProfile && (
            <Button asChild variant="default" size="sm" className="mt-4">
              <Link href="/trading#create">Create Trade Ad</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentPageAds.map((trade) => (
              <TradeAdCard
                key={trade.id}
                trade={trade}
                currentUserId={currentUserId}
                actionsVariant="details-only"
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
