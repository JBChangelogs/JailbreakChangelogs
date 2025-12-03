"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { fetchUserNetworth, UserNetworthData } from "@/utils/api";
import { formatFullDate } from "@/utils/timestamp";
import InventoryBreakdownModal from "../Modals/InventoryBreakdownModal";

export default function UserNetworthDisplay() {
  const { user, isAuthenticated } = useAuthContext();
  const [userNetworth, setUserNetworth] = useState<UserNetworthData[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  // Avatar URL is now generated directly from user ID
  const avatarUrl = user?.roblox_id
    ? `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${user.roblox_id}/avatar-headshot`
    : null;
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

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

  const latestData = userNetworth[0]; // Get the most recent data
  const displayName =
    user.roblox_display_name ||
    user.roblox_username ||
    `User ${user.roblox_id}`;

  return (
    <div className="mb-6">
      <div className="mb-2">
        <h3 className="text-primary-text text-lg font-semibold">
          Your Networth
        </h3>
        <p className="text-secondary-text text-xs">
          Last Updated {formatFullDate(latestData.snapshot_time)}
        </p>
      </div>

      <div
        className="mb-0 cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-lg bg-secondary-bg border-border-primary hover:border-border-focus"
        onClick={() => setIsBreakdownModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsBreakdownModalOpen(true);
          }
        }}
      >
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName} avatar`}
                width={32}
                height={32}
                className="bg-tertiary-bg h-7 w-7 rounded-full sm:h-8 sm:w-8"
              />
            ) : (
              <div className="bg-tertiary-bg h-7 w-7 rounded-full sm:h-8 sm:w-8" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/inventories/${user.roblox_id}`}
                prefetch={false}
                className="text-primary-text hover:text-link cursor-pointer truncate text-sm font-medium transition-colors sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {displayName}
              </Link>
              <Link
                href={`/inventories/${user.roblox_id}`}
                prefetch={false}
                className="text-secondary-text hover:text-link cursor-pointer truncate text-xs transition-colors sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                @{user.roblox_username || user.roblox_id}
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 sm:ml-2 sm:justify-start">
            <div className="text-center sm:text-right">
              <span className="text-button-success text-sm font-bold sm:text-lg">
                ${formatNetworth(latestData.networth)}
              </span>
              <div className="text-secondary-text text-xs">
                {formatInventoryCount(latestData.inventory_count)} items
              </div>
              {(latestData.money !== undefined ||
                latestData.inventory_value !== undefined ||
                latestData.percentages) && (
                <div className="mt-1 flex justify-center sm:justify-end">
                  <div className="text-form-button-text bg-button-info hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none">
                    Click to view breakdown
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <InventoryBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        username={displayName}
        networth={latestData.networth}
        inventoryCount={latestData.inventory_count}
        percentages={latestData.percentages || {}}
        money={latestData.money}
        inventoryValue={latestData.inventory_value}
        duplicatesCount={latestData.duplicates_count}
        duplicatesValue={latestData.duplicates_value}
        duplicatesPercentages={latestData.duplicates_percentages}
      />
    </div>
  );
}
