"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  fetchUserNetworth,
  UserNetworthData,
  fetchRobloxAvatars,
} from "@/utils/api";
import { formatFullDate } from "@/utils/timestamp";

export default function UserNetworthDisplay() {
  const { user, isAuthenticated } = useAuthContext();
  const [userNetworth, setUserNetworth] = useState<UserNetworthData[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserNetworthData = async () => {
      if (!isAuthenticated || !user?.roblox_id) {
        return;
      }

      setIsLoading(true);
      try {
        const [data, avatarData] = await Promise.all([
          fetchUserNetworth(user.roblox_id),
          fetchRobloxAvatars([user.roblox_id.toString()]),
        ]);

        setUserNetworth(data);

        if (avatarData && typeof avatarData === "object") {
          const avatarEntry = Object.values(avatarData).find(
            (avatar: { targetId?: number; imageUrl?: string }) =>
              avatar && avatar.targetId && avatar.imageUrl,
          );
          if (avatarEntry) {
            setAvatarUrl(avatarEntry.imageUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user networth:", error);
        setUserNetworth([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserNetworthData();
  }, [isAuthenticated, user?.roblox_id]);

  if (!isAuthenticated || !user?.roblox_id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-6 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-text text-lg font-semibold">
              Your Networth
            </h3>
            <p className="text-secondary-text text-sm">
              Loading your networth...
            </p>
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  // If no data or empty array, don't show anything
  if (!userNetworth || userNetworth.length === 0) {
    return null;
  }

  const formatNetworth = (networth: number) => {
    return new Intl.NumberFormat("en-US").format(networth);
  };

  const formatInventoryCount = (count: number) => {
    return new Intl.NumberFormat("en-US").format(count);
  };

  const latestData = userNetworth[0]; // Get the most recent data

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h3 className="text-primary-text text-lg font-semibold">
          Your Networth
        </h3>
        <p className="text-secondary-text text-sm">
          Last Updated {formatFullDate(latestData.snapshot_time)}
        </p>
      </div>

      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${user.roblox_display_name || user.roblox_username || `User ${user.roblox_id}`} avatar`}
                width={32}
                height={32}
                className="bg-primary-bg h-8 w-8 rounded-full"
              />
            ) : (
              <div className="bg-primary-bg h-8 w-8 rounded-full" />
            )}
            <div>
              <div className="text-primary-text text-sm font-medium">
                {user.roblox_display_name ||
                  user.roblox_username ||
                  `User ${user.roblox_id}`}
              </div>
              <div className="text-secondary-text text-xs">
                @{user.roblox_username || user.roblox_id}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-button-success text-lg font-bold">
              ${formatNetworth(latestData.networth)}
            </div>
            <div className="text-secondary-text text-sm">
              {formatInventoryCount(latestData.inventory_count)} items
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
