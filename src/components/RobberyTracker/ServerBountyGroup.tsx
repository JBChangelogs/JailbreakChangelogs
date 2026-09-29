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
import JoinedUsers from "./JoinedUsers";
import type {
  TrackerJoinUser,
  TrackerJoinReport,
} from "@/hooks/trackerJoinHistory";
import { useRobberyTrackerLastJoinedServer } from "@/hooks/useRobberyTrackerLastJoinedServer";

interface ServerBountyGroupProps {
  serverId: string;
  bounties: BountyData[];
  regionData?: ServerRegionData | null;
  useExternalRegionData?: boolean;
  joinedUsers: TrackerJoinUser[];
  onJoin: (report: TrackerJoinReport) => void;
}

export default function ServerBountyGroup({
  serverId,
  bounties,
  regionData: externalRegionData,
  useExternalRegionData = false,
  joinedUsers,
  onJoin,
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
  const { lastJoined, setLastJoined } = useRobberyTrackerLastJoinedServer();
  const isLastJoined = Boolean(jobId && lastJoined?.jobId === jobId);
  const lastJoinedRelative = useOptimizedRealTimeRelativeDate(
    isLastJoined ? lastJoined?.joinedAt : null,
    `bounty-last-joined-${jobId || "unknown"}`,
  );

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
    <div className="flex flex-col gap-3">
      {/* Header Section */}
      <div className="bg-tertiary-bg border-border-card flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side: Stats */}
        <div className="flex flex-col gap-2">
          {/* Total Value & Counts */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex flex-col">
              <span className="text-secondary-text text-xs font-medium tracking-wider uppercase">
                Total Server Bounty
              </span>
              <span className="text-status-warning text-2xl font-bold">
                ${totalBounty.toLocaleString()}
              </span>
            </div>

            <span className="text-tertiary-text hidden text-2xl font-light sm:inline">
              |
            </span>

            <div className="text-secondary-text flex items-center gap-2 text-sm">
              <Icon
                icon="heroicons-outline:users"
                className="h-4 w-4 shrink-0"
              />
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
          <JoinedUsers users={joinedUsers} variant="bounty" />
        </div>

        {/* Right Side: Actions & Info */}
        <div className="flex flex-col gap-3 lg:items-end">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                  onJoin({
                    server_id: jobId,
                    marker_name: "Bounty",
                    display_name: "Bounty",
                    tracker_type: "bounty",
                  });
                  setLastJoined({
                    kind: "bounty",
                    jobId,
                    joinedAt: Math.floor(Date.now() / 1000),
                    label: "Bounty",
                    tracker: "bounties",
                  });
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
                {isJoining
                  ? "Joining..."
                  : isLastJoined
                    ? "Rejoin Server"
                    : "Join Server"}
              </Button>
            )}
          </div>

          {isLastJoined && !isJoining && lastJoinedRelative && (
            <div className="border-status-success/30 bg-status-success/10 text-primary-text inline-flex max-w-full items-center self-start rounded-lg border px-2 py-1 text-xs font-semibold lg:self-end">
              Last joined {lastJoinedRelative}
            </div>
          )}

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
              <Icon
                icon="heroicons:clock"
                className="text-secondary-text h-4 w-4 shrink-0"
              />
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

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bounties.map((bounty, index) => (
          <BountyCard
            key={`${bounty.userid}-${bounty.server?.job_id || index}-${bounty.timestamp}`}
            bounty={bounty}
            simplified={true}
          />
        ))}
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
