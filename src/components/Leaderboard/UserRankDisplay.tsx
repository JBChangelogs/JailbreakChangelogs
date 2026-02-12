"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import { formatRelativeDate, formatCustomDate } from "@/utils/timestamp";

interface UserRankData {
  user_id: string;
  rank: number;
  money: number;
  updated_at: number;
}

export default function UserRankDisplay() {
  const { user, isAuthenticated } = useAuthContext();
  const [userRank, setUserRank] = useState<UserRankData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserRank = async () => {
      if (!isAuthenticated || !user?.roblox_id) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/money/rank?user_id=${user.roblox_id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setUserRank(data);
        } else if (response.status === 404) {
          // User doesn't have a rank, hide the component
          setUserRank(null);
        }
      } catch (error) {
        console.error("Error fetching user rank:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRank();
  }, [isAuthenticated, user?.roblox_id]);

  if (!isAuthenticated || !user?.roblox_id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-text text-lg font-semibold">
              Your Rank
            </h3>
            <p className="text-secondary-text text-sm">Loading your rank...</p>
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  // Hide component if user doesn't have a rank (404 response)
  if (!userRank) {
    return null;
  }

  const formatMoney = (money: number) => {
    return new Intl.NumberFormat("en-US").format(money);
  };

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-primary-text text-lg font-bold sm:text-xl">
          Your Rank
        </h2>
        <span className="text-secondary-text text-xs sm:text-sm">
          Last Updated {formatCustomDate(userRank.updated_at)} (
          {formatRelativeDate(userRank.updated_at)})
        </span>
      </div>
      <div className="border-border-card bg-secondary-bg rounded-lg border p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-primary-text flex h-7 min-w-[2.5rem] items-center justify-center rounded-full px-1 text-xs font-bold sm:h-8 sm:min-w-[3rem] sm:px-2">
              #{userRank.rank.toLocaleString()}
            </div>
            {user.roblox_avatar ? (
              <Image
                src={user.roblox_avatar}
                alt={`${user.roblox_display_name} avatar`}
                width={32}
                height={32}
                className="border-border-card bg-secondary-bg h-7 w-7 rounded-full border sm:h-8 sm:w-8"
              />
            ) : (
              <div className="border-border-card bg-secondary-bg h-7 w-7 rounded-full border sm:h-8 sm:w-8" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <a
                href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-text hover:text-link-hover truncate text-sm font-medium transition-colors sm:text-base"
              >
                {user.roblox_display_name}
              </a>
              <a
                href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-text hover:text-link-hover truncate text-xs transition-colors sm:text-sm"
              >
                @{user.roblox_username}
              </a>
            </div>
          </div>
          <div className="ml-2 flex items-center space-x-2">
            <span className="text-button-success text-sm font-bold sm:text-lg">
              ${formatMoney(userRank.money)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
