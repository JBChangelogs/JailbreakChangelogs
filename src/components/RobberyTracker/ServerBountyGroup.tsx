"use client";

import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { BountyData } from "@/hooks/useRobberyTrackerBountiesWebSocket";
import BountyCard from "./BountyCard";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import RobberyPlayersModal from "./RobberyPlayersModal";

interface ServerBountyGroupProps {
  serverId: string;
  bounties: BountyData[];
}

export default function ServerBountyGroup({
  serverId,
  bounties,
}: ServerBountyGroupProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = React.useState(false);

  // Calculate total bounty value for the server
  const totalBounty = bounties.reduce((sum, b) => sum + b.bounty, 0);

  // Get unique cop count from server players
  const players = bounties[0]?.server?.players || [];
  const copCount = players.filter((p) => p.team === "Police").length;

  // Format bounty amount with commas
  const formatBounty = (amount: number): string => {
    return amount.toLocaleString();
  };

  // Get the first bounty's job_id for the Join Server link
  const jobId = bounties[0]?.server?.job_id || "";

  // Get latest timestamp for "Last update"
  const latestTimestamp = Math.max(...bounties.map((b) => b.timestamp));
  const timerId = `server-group-${serverId}-${latestTimestamp}`;
  const relativeTime = useOptimizedRealTimeRelativeDate(
    latestTimestamp,
    timerId,
  );

  // Format server time
  const formatServerTime = (serverTime: number) => {
    const hours24 = Math.floor(serverTime);
    const minutes = Math.floor((serverTime % 1) * 60);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const serverTime = bounties[0]?.server_time;

  return (
    <div className="border-border-primary flex flex-col overflow-hidden rounded-xl border">
      {/* Header Section */}
      <div className="bg-secondary-bg border-border-primary flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Stats */}
        <div className="flex flex-col gap-2">
          {/* Total Value & Counts */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex flex-col">
              <span className="text-secondary-text text-xs font-medium tracking-wider uppercase">
                Total Server Bounty
              </span>
              <div className="flex items-center gap-1.5">
                <Icon
                  icon="heroicons:currency-dollar"
                  className="h-6 w-6 text-yellow-400"
                />
                <span className="text-2xl font-bold text-yellow-400">
                  ${formatBounty(totalBounty)}
                </span>
              </div>
            </div>

            <span className="text-tertiary-text hidden text-2xl font-light sm:inline">
              |
            </span>

            <div className="flex items-center gap-3">
              <span className="text-secondary-text text-sm font-medium">
                {bounties.length}{" "}
                {bounties.length === 1 ? "Bounty" : "Bounties"}
              </span>

              <span className="text-tertiary-text text-sm">•</span>
              <span className="text-secondary-text text-sm font-medium">
                {copCount} {copCount === 1 ? "Cop" : "Cops"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Actions & Info */}
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-4">
            {/* Server Time */}
            {serverTime && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-secondary-text">Server Time:</span>
                <span className="text-primary-text font-mono font-medium">
                  {formatServerTime(serverTime)}
                </span>
              </div>
            )}

            {/* View Players Button */}
            {players.length > 0 && (
              <button
                onClick={() => setIsPlayersModalOpen(true)}
                className="bg-button-secondary text-primary-text hover:bg-button-secondary-hover focus:ring-border-focus active:bg-button-secondary-active flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
              >
                <Icon icon="heroicons-outline:users" className="h-3.5 w-3.5" />
                View {players.length} Players
              </button>
            )}

            {/* Join Server Button */}
            {jobId && (
              <a
                href={`http://tracker.jailbreakchangelogs.xyz/?jobid=${jobId}&utm_campaign=Bounty_Tracker&utm_term=${totalBounty}&utm_source=website`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-button-info text-form-button-text hover:bg-button-info-hover focus:ring-border-focus active:bg-button-info-active flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
              >
                <Icon
                  icon="heroicons:arrow-top-right-on-square"
                  className="h-3.5 w-3.5"
                />
                Join Server
              </a>
            )}
          </div>

          {/* Last Update */}
          <div className="text-tertiary-text flex items-center gap-1.5 text-xs">
            <Icon icon="mdi:clock" className="h-3 w-3" />
            <span>Last update: {relativeTime || "Just now"}</span>
          </div>
        </div>
      </div>

      {/* Content Section: Bounties Grid */}
      <div className="bg-tertiary-bg/5 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bounties.map((bounty, index) => (
            <BountyCard
              key={`${bounty.userid}-${bounty.server?.job_id || index}-${bounty.timestamp}`}
              bounty={bounty}
              simplified={true}
            />
          ))}
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
