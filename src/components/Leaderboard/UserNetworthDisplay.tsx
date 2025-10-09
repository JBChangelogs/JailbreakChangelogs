"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { fetchUserNetworth, UserNetworthData } from "@/utils/api";

export default function UserNetworthDisplay() {
  const { user, isAuthenticated } = useAuthContext();
  const [userNetworth, setUserNetworth] = useState<UserNetworthData[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserNetworthData = async () => {
      if (!isAuthenticated || !user?.roblox_id) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchUserNetworth(user.roblox_id);
        setUserNetworth(data);
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

  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const latestData = userNetworth[0]; // Get the most recent data

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h3 className="text-primary-text text-lg font-semibold">
          Your Networth
        </h3>
        <p className="text-secondary-text text-sm">
          Last Updated {formatLastUpdated(latestData.snapshot_time)}
        </p>
      </div>

      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-button-success/10 rounded-full p-3">
              <svg
                className="text-button-success h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
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
