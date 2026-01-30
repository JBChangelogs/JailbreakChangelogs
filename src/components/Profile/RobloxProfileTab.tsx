"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { formatShortDate, formatCustomDate } from "@/utils/timestamp";
import TradeAdsTab from "./TradeAdsTab";
import { CircularProgress, Skeleton } from "@mui/material";

import { Tooltip } from "@mui/material";

interface User {
  id: string;
  roblox_id?: string | null;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
  roblox_join_date?: number;
}

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

interface RobloxProfileTabProps {
  user: User;
  tradeAds?: TradeAd[];
  isLoadingAdditionalData?: boolean;
  isOwnProfile?: boolean;
}

export default function RobloxProfileTab({
  user,
  tradeAds = [],
  isLoadingAdditionalData = false,
  isOwnProfile = false,
}: RobloxProfileTabProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="space-y-6">
      {/* Roblox Profile Card */}
      <div className="border-border-primary rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-2">
          <RobloxIcon className="text-button-info h-6 w-6" />
          <h2 className="text-primary-text text-lg font-semibold">
            Roblox Profile
          </h2>
        </div>

        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Roblox Avatar */}
          <div className="border-button-info bg-primary-bg relative h-32 w-32 overflow-hidden rounded-lg border-2">
            {!imageError && user.roblox_avatar ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CircularProgress
                      size={32}
                      sx={{ color: "var(--color-button-info)" }}
                    />
                  </div>
                )}
                <div className="absolute inset-0">
                  <Image
                    src={user.roblox_avatar}
                    alt={`${user.roblox_display_name || user.roblox_username || "Roblox"} user's profile picture`}
                    fill
                    draggable={false}
                    className="object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <RobloxIcon className="text-primary-text h-12 w-12" />
              </div>
            )}
          </div>

          {/* Roblox Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="space-y-2">
              <div>
                {isLoadingAdditionalData ? (
                  <>
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={28}
                      sx={{ mb: 1 }}
                    />
                    <Skeleton variant="text" width="40%" height={20} />
                  </>
                ) : (
                  <>
                    <h3 className="text-primary-text text-xl font-semibold">
                      {user.roblox_display_name || user.roblox_username}
                    </h3>
                    <p className="text-secondary-text">
                      @{user.roblox_username}
                    </p>
                  </>
                )}
              </div>

              <div className="text-secondary-text text-sm">
                {isLoadingAdditionalData ? (
                  <Skeleton variant="text" width="50%" height={16} />
                ) : (
                  user.roblox_join_date && (
                    <span className="text-secondary-text">
                      <span className="text-primary-text">Member since</span>{" "}
                      <Tooltip
                        title={formatCustomDate(user.roblox_join_date)}
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
                        <span className="cursor-help">
                          {formatShortDate(user.roblox_join_date)}
                        </span>
                      </Tooltip>
                    </span>
                  )
                )}
              </div>

              {user.roblox_id && (
                <div className="pt-2">
                  <Button asChild variant="default" size="md">
                    <Link
                      href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>View Roblox Profile</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Ads Section */}
      <TradeAdsTab
        userId={user.id}
        tradeAds={tradeAds}
        isLoadingAdditionalData={isLoadingAdditionalData}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
