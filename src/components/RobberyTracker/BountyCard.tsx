"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { BountyData } from "@/hooks/useRobberyTrackerBountiesWebSocket";
import RobberyPlayersModal from "./RobberyPlayersModal";

interface BountyCardProps {
  bounty: BountyData;
}

export default function BountyCard({ bounty }: BountyCardProps) {
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
    <div className="border-border-primary bg-secondary-bg hover:border-border-focus flex flex-col overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="bg-tertiary-bg p-4">
        <div className="mb-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
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
              className="text-primary-text hover:text-button-info block truncate text-lg font-semibold transition-colors duration-200"
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
              Inventory ({bounty.inventory.length} items)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bounty.inventory.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="bg-secondary-background text-secondary-text rounded px-2 py-1 text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="text-secondary-text space-y-2 text-sm">
          {bounty.server_time && (
            <div className="flex items-center justify-between">
              <span className="text-secondary-text">Server Time:</span>
              <span className="font-mono">
                {formatServerTime(bounty.server_time)}
              </span>
            </div>
          )}

          {/* Join Server Button */}
          {jobId && (
            <a
              href={`http://tracker.jailbreakchangelogs.xyz/?jobid=${jobId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover focus:ring-border-focus active:bg-button-info-active mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
            >
              <Icon
                icon="heroicons:arrow-top-right-on-square"
                className="h-4 w-4"
              />
              Join Server
            </a>
          )}

          {/* View Players Button */}
          {players.length > 0 && (
            <button
              onClick={() => setIsPlayersModalOpen(true)}
              className="active:bg-button-secondary-active bg-button-secondary text-primary-text hover:bg-button-secondary-hover focus:ring-border-focus mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
            >
              <Icon icon="heroicons-outline:users" className="h-4 w-4" />
              View {players.length} Players
            </button>
          )}
        </div>

        {/* Footer with Last Update */}
        <div className="border-border-primary mt-4 border-t pt-3">
          <div className="text-primary-text flex items-center justify-center gap-1.5 text-xs font-medium">
            <Icon icon="mdi:clock" className="text-tertiary-text h-3.5 w-3.5" />
            <span>Last update: {relativeTime || "Just now"}</span>
          </div>
        </div>
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
