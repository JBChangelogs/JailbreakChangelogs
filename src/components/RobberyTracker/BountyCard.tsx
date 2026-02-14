"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { BountyData } from "@/hooks/useRobberyTrackerBountiesWebSocket";
import RobberyPlayersModal from "./RobberyPlayersModal";

interface BountyCardProps {
  bounty: BountyData;
  simplified?: boolean;
}

export default function BountyCard({
  bounty,
  simplified = false,
}: BountyCardProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);

  // Format bounty amount with commas
  const formatBounty = (amount: number): string => {
    return amount.toLocaleString();
  };

  // Get Roblox avatar URL
  const getAvatarUrl = (userId: number): string => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  // Create unique ID for timer subscription
  const jobId = bounty.server?.job_id || "";
  const timerId = `bounty-${bounty.userid}-${jobId}-${bounty.timestamp}`;

  // Use real-time updating relative timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    bounty.timestamp,
    timerId,
  );

  // Format server time as 12-hour clock with AM/PM
  const formatServerTime = (serverTime: number) => {
    const hours24 = Math.floor(serverTime);
    const minutes = Math.floor((serverTime % 1) * 60);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const players = bounty.server?.players || [];

  return (
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="bg-tertiary-bg p-4">
        <div className="mb-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="border-border-card relative h-12 w-12 shrink-0 overflow-hidden rounded-full border">
            <Image
              src={getAvatarUrl(bounty.userid)}
              alt={bounty.display_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Player Name */}
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.roblox.com/users/${bounty.userid}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text hover:text-link block truncate text-lg font-semibold transition-colors duration-200"
            >
              {bounty.display_name}
            </a>
          </div>
        </div>

        {/* Bounty Amount */}
        <div className="flex items-center gap-2">
          <Icon
            icon="heroicons:currency-dollar"
            className="h-6 w-6 text-yellow-400"
          />
          <span className="text-2xl font-bold text-yellow-400">
            ${formatBounty(bounty.bounty)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex grow flex-col p-4">
        {/* Inventory */}
        {bounty.inventory.length > 0 && (
          <div className="mb-3">
            <div className="text-secondary-text mb-2 flex items-center gap-2 text-sm font-medium">
              <Icon icon="heroicons:cube" className="h-4 w-4" />
              Inventory ({bounty.inventory.length}{" "}
              {bounty.inventory.length === 1 ? "item" : "items"})
            </div>
            <div className="bg-secondary-bg flex flex-wrap gap-1.5 rounded-lg p-2">
              {bounty.inventory.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="text-primary-text bg-tertiary-bg/40 border-border-card inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Details - Only show if not simplified */}
        {!simplified && (
          <div className="text-secondary-text space-y-2 text-sm">
            {bounty.server_time && (
              <div className="flex items-center justify-between">
                <span className="text-secondary-text">Server Time:</span>
                <span className="font-mono">
                  {formatServerTime(bounty.server_time)}
                </span>
              </div>
            )}

            {/* View Players Button */}
            {players.length > 0 && (
              <Button
                onClick={() => setIsPlayersModalOpen(true)}
                variant="secondary"
                className="mt-2 w-full"
              >
                <Icon icon="heroicons-outline:users" className="h-4 w-4" />
                View {players.length} Players
              </Button>
            )}
          </div>
        )}

        {/* Footer with Last Update - Only show if not simplified */}
        {!simplified && (
          <div className="border-border-card mt-4 border-t pt-3">
            <div className="text-primary-text flex items-center justify-center gap-1.5 text-xs font-medium">
              <Icon
                icon="mdi:clock"
                className="text-tertiary-text h-3.5 w-3.5"
              />
              <span>Last update: {relativeTime || "Just now"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Players Modal */}
      {players.length > 0 && (
        <RobberyPlayersModal
          isOpen={isPlayersModalOpen}
          onClose={() => setIsPlayersModalOpen(false)}
          players={players}
        />
      )}
    </div>
  );
}
