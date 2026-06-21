"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  RobberyData,
  ServerRegionData,
} from "@/hooks/useRobberyTrackerWebSocket";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { useServerRegions } from "@/hooks/useServerRegions";
import { toast } from "sonner";
import { buildRobloxServerDeepLink } from "./deepLink";
import InlineTeamPlayers from "./InlineTeamPlayers";
import { useRobberyTrackerLastJoinedServer } from "@/hooks/useRobberyTrackerLastJoinedServer";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { formatServerTime, getStatusBadgeClass } from "./utils";

interface RobberyComboCardProps {
  comboId: string;
  serverId: string;
  robberies: RobberyData[];
  comboLabel: string;
  regionData?: ServerRegionData | null;
  useExternalRegionData?: boolean;
}

function getStatusText(status: number): string {
  switch (status) {
    case 1:
      return "Open";
    case 2:
      return "In Progress";
    case 3:
      return "Closed";
    default:
      return "Unknown";
  }
}

const COMBO_IMAGE_URLS: Record<string, string> = {
  "museum-power":
    "https://assets.jailbreakchangelogs.com/assets/images/robberies/combos/Power_Museum_Combo.webp",
};

export default function RobberyComboCard({
  comboId,
  serverId,
  robberies,
  comboLabel,
  regionData: externalRegionData,
  useExternalRegionData = false,
}: RobberyComboCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [internalRegionData, setInternalRegionData] =
    useState<ServerRegionData | null>(null);
  const { fetchRegionData } = useServerRegions();
  const regionData = useExternalRegionData
    ? (externalRegionData ?? null)
    : internalRegionData;
  const { lastJoined, setLastJoined } = useRobberyTrackerLastJoinedServer();
  const isLastJoined = Boolean(
    serverId &&
    lastJoined?.kind === "combo" &&
    lastJoined.jobId === serverId &&
    lastJoined.comboId === comboId,
  );
  const showLastJoinedState = isLastJoined && !isJoining;
  const lastJoinedRelative = useOptimizedRealTimeRelativeDate(
    isLastJoined ? lastJoined?.joinedAt : null,
    `combo-last-joined-${serverId || "unknown"}-${comboId}`,
  );

  const { sortedRobberies, latestTimestamp, isAllOpen, isAllInProgress } =
    useMemo(() => {
      const sorted = [...robberies].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const latest = sorted.reduce(
        (max, r) => (r.timestamp > max ? r.timestamp : max),
        sorted[0]?.timestamp ?? 0,
      );
      let allOpen = sorted.length > 0;
      let allInProgress = sorted.length > 0;
      for (const r of sorted) {
        if (r.status !== 1) allOpen = false;
        if (r.status !== 2) allInProgress = false;
      }
      return {
        sortedRobberies: sorted,
        latestTimestamp: latest,
        isAllOpen: allOpen,
        isAllInProgress: allInProgress,
      };
    }, [robberies]);

  const timerId = `combo-${serverId}-${latestTimestamp}`;
  const relativeTime = useOptimizedRealTimeRelativeDate(
    latestTimestamp,
    timerId,
  );

  const firstRobbery = sortedRobberies[0];
  const players = firstRobbery?.server?.players || [];
  const comboImageUrl = COMBO_IMAGE_URLS[comboId];

  useEffect(() => {
    if (useExternalRegionData || !serverId || internalRegionData) return;

    fetchRegionData([serverId]).then((results) => {
      const data = results[serverId];
      if (data) setInternalRegionData(data);
    });
  }, [useExternalRegionData, serverId, fetchRegionData, internalRegionData]);

  const comboHeaderStatusText = isAllOpen ? "All Open" : "All In Progress";
  const comboHeaderStatusClass = isAllOpen
    ? getStatusBadgeClass(1)
    : getStatusBadgeClass(2);

  const displayRobberies = sortedRobberies.slice(0, 4);
  const remainingCount = sortedRobberies.length - displayRobberies.length;

  return (
    <div
      className={cn(
        "border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg",
        showLastJoinedState && "bg-tertiary-bg",
      )}
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row">
        {/* Thumbnail */}
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-white/5 sm:h-16 sm:w-24">
          {comboImageUrl ? (
            <Image
              src={comboImageUrl}
              alt={comboLabel}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-tertiary-bg border-border-card text-primary-text flex h-full items-center justify-center border text-sm font-semibold">
              {comboLabel}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-primary-text min-w-0 flex-1 truncate text-base font-semibold">
              {comboLabel}
            </h3>
            {(isAllOpen || isAllInProgress) && (
              <span
                className={`${comboHeaderStatusClass} inline-flex h-6 items-center rounded-lg border px-2.5 text-xs font-medium`}
              >
                {comboHeaderStatusText}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {displayRobberies.map((robbery) => (
              <span
                key={`${robbery.marker_name}-${robbery.timestamp}`}
                className={`${getStatusBadgeClass(robbery.status)} inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium`}
              >
                <span className="truncate">{robbery.name}</span>
                <span className="text-tertiary-text">•</span>
                <span className="shrink-0">
                  {getStatusText(robbery.status)}
                </span>
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-primary-text border-border-card bg-tertiary-bg inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium">
                +{remainingCount} more
              </span>
            )}
          </div>

          <div className="text-secondary-text mt-2 flex items-center gap-2 text-xs">
            <Icon icon="heroicons:clock" className="h-4 w-4 shrink-0" />
            <span className="text-primary-text font-mono tabular-nums">
              {formatServerTime(firstRobbery.server_time)}
            </span>
          </div>

          <InlineTeamPlayers players={players} className="mt-1" />

          <div className="text-secondary-text mt-1 flex items-center gap-2 text-xs">
            <Icon icon="heroicons:map-pin" className="h-4 w-4 shrink-0" />
            <span className="text-primary-text truncate font-medium">
              {regionData ? (
                `${regionData.city}, ${regionData.regionName}, ${regionData.country}`
              ) : (
                <span className="text-secondary-text inline-flex items-center gap-2">
                  <Spinner className="h-3.5 w-3.5" />
                  Loading region...
                </span>
              )}
            </span>
          </div>

          <div className="mt-2">
            {showLastJoinedState && lastJoinedRelative && (
              <div className="border-status-success/30 bg-status-success/10 text-primary-text mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold">
                <span className="truncate">
                  Last joined {lastJoinedRelative}
                </span>
              </div>
            )}
            <Button
              size="sm"
              variant="default"
              className="w-full min-w-0"
              disabled={isJoining}
              data-rybbit-event="Join Server"
              data-rybbit-prop-tracker="Robbery_Tracker"
              data-rybbit-prop-term="Power Combo"
              onClick={() => {
                setIsJoining(true);
                setLastJoined({
                  kind: "combo",
                  jobId: serverId,
                  comboId,
                  joinedAt: Math.floor(Date.now() / 1000),
                  label: comboLabel,
                  tracker: "robberies",
                });
                const joiningToastId = toast.loading("Joining server...");
                window.setTimeout(() => {
                  toast.dismiss(joiningToastId);
                  setIsJoining(false);
                }, 5000);
                window.location.assign(buildRobloxServerDeepLink(serverId));
              }}
            >
              <Icon icon="heroicons:arrow-top-right-on-square" />
              {isJoining ? "Joining..." : isLastJoined ? "Rejoin" : "Join"}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-border-card border-t px-3 py-2">
        <div className="text-secondary-text text-center text-xs font-medium tabular-nums">
          Logged {relativeTime || "Just now"}
        </div>
      </div>
    </div>
  );
}
