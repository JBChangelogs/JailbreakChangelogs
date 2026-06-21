"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { BountyData } from "@/hooks/useRobberyTrackerBountiesWebSocket";
import BountyCard from "./BountyCard";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import RobberyPlayersModal from "./RobberyPlayersModal";
import { toast } from "sonner";
import { useServerRegions } from "@/hooks/useServerRegions";
import { ServerRegionData } from "@/hooks/useRobberyTrackerWebSocket";
import { buildRobloxServerDeepLink } from "./deepLink";
import { Spinner } from "@/components/ui/Spinner";
import { formatServerTime } from "./utils";

interface ServerBountyGroupProps {
  serverId: string;
  bounties: BountyData[];
  regionData?: ServerRegionData | null;
  useExternalRegionData?: boolean;
}

export default function ServerBountyGroup({
  serverId,
  bounties,
  regionData: externalRegionData,
  useExternalRegionData = false,
}: ServerBountyGroupProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [internalRegionData, setInternalRegionData] =
    useState<ServerRegionData | null>(null);

  const { fetchRegionData } = useServerRegions();
  const regionData = useExternalRegionData
    ? (externalRegionData ?? null)
    : internalRegionData;

  // Calculate total bounty value for the server
  const totalBounty = bounties.reduce((sum, b) => sum + b.bounty, 0);

  const jobId = bounties[0]?.server?.job_id || "";

  // Get unique cop count from server players
  const players = bounties[0]?.server?.players || [];
  const copCount = players.filter((p) => p.team === "Police").length;

  // Get latest timestamp for "Last update"
  const latestTimestamp = bounties.reduce(
    (max, b) => (b.timestamp > max ? b.timestamp : max),
    bounties[0].timestamp,
  );
  const timerId = `server-group-${serverId}-${latestTimestamp}`;
  const relativeTime = useOptimizedRealTimeRelativeDate(
    latestTimestamp,
    timerId,
  );

  const serverTime = bounties[0]?.server_time;

  useEffect(() => {
    if (useExternalRegionData || !jobId) return;

    fetchRegionData([jobId]).then((results) => {
      const data = results[jobId];
      if (data) setInternalRegionData(data);
    });
  }, [useExternalRegionData, jobId, fetchRegionData]);

  return (
    <div className="border-border-card flex flex-col overflow-hidden rounded-xl border">
      {/* Header Section */}
      <div className="bg-tertiary-bg border-border-card flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
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
                  ${totalBounty.toLocaleString()}
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
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Players Button */}
            {players.length > 0 && (
              <Button
                onClick={() => setIsPlayersModalOpen(true)}
                variant="secondary"
                size="sm"
              >
                <Icon icon="heroicons-outline:users" className="h-3.5 w-3.5" />
                View {players.length} Players
              </Button>
            )}

            {/* Join Server Button */}
            {jobId && (
              <Button
                variant="default"
                size="sm"
                disabled={isJoining}
                data-rybbit-event="Join Server"
                data-rybbit-prop-tracker="Bounty_Tracker"
                data-rybbit-prop-term="Bounty"
                onClick={() => {
                  setIsJoining(true);
                  const joiningToastId = toast.loading("Joining server...");
                  window.setTimeout(() => {
                    toast.dismiss(joiningToastId);
                    setIsJoining(false);
                  }, 5000);
                  window.location.assign(buildRobloxServerDeepLink(jobId));
                }}
              >
                <Icon
                  icon="heroicons:arrow-top-right-on-square"
                  className="h-3.5 w-3.5"
                />
                {isJoining ? "Joining..." : "Join Server"}
              </Button>
            )}
          </div>

          {/* Server Region */}
          <div className="flex items-center gap-1.5 text-sm">
            <Icon
              icon="mdi:map-marker"
              className="text-secondary-text h-4 w-4"
            />
            <span className="text-secondary-text">
              {regionData ? (
                `${regionData.city}, ${regionData.regionName}, ${regionData.country}`
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-3.5 w-3.5" />
                  Loading...
                </span>
              )}
            </span>
          </div>

          {/* Server Time */}
          {serverTime && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-secondary-text">Server Time:</span>
              <span className="text-primary-text font-mono font-medium">
                {formatServerTime(serverTime)}
              </span>
            </div>
          )}

          {/* Last Update */}
          <div className="text-secondary-text flex items-center gap-1.5 text-xs">
            <span>Logged {relativeTime || "Just now"}</span>
          </div>
        </div>
      </div>

      {/* Content Section: Bounties Grid */}
      <div className="bg-secondary-bg p-4">
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
