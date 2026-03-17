"use client";

import { useEffect, useState } from "react";
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

interface RobberyComboCardProps {
  comboId: string;
  serverId: string;
  robberies: RobberyData[];
  comboLabel: string;
}

export default function RobberyComboCard({
  comboId,
  serverId,
  robberies,
  comboLabel,
}: RobberyComboCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [regionData, setRegionData] = useState<ServerRegionData | null>(null);
  const { fetchRegionData } = useServerRegions();

  const sortedRobberies = [...robberies].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const latestTimestamp = Math.max(...sortedRobberies.map((r) => r.timestamp));
  const timerId = `combo-${serverId}-${latestTimestamp}`;
  const relativeTime = useOptimizedRealTimeRelativeDate(
    latestTimestamp,
    timerId,
  );

  const firstRobbery = sortedRobberies[0];
  const players = firstRobbery?.server?.players || [];
  const comboImageUrls: Record<string, string> = {
    "museum-power":
      "https://assets.jailbreakchangelogs.xyz/assets/images/robberies/combos/Power_Museum_Combo.webp",
    "double-bank":
      "https://assets.jailbreakchangelogs.xyz/assets/images/robberies/combos/Bank_Combo.webp",
  };
  const comboImageUrl = comboImageUrls[comboId];

  useEffect(() => {
    if (!serverId) return;

    fetchRegionData([serverId]).then((results) => {
      const data = results[serverId];
      if (data) setRegionData(data);
    });
  }, [serverId, fetchRegionData]);

  const formatServerTime = (serverTime: number) => {
    const hours24 = Math.floor(serverTime);
    const minutes = Math.floor((serverTime % 1) * 60);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 1:
        return "text-primary-text border-status-success/30 bg-status-success/20";
      case 2:
        return "text-primary-text border-status-warning/30 bg-status-warning/20";
      case 3:
        return "text-primary-text border-border-card bg-tertiary-bg";
      default:
        return "text-primary-text border-border-card bg-tertiary-bg";
    }
  };

  const getStatusText = (status: number) => {
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
  };

  const uniqueStatuses = Array.from(
    new Set(sortedRobberies.map((r) => r.status)),
  );
  const isAllOpen = uniqueStatuses.length === 1 && uniqueStatuses[0] === 1;
  const isAllInProgress =
    uniqueStatuses.length === 1 && uniqueStatuses[0] === 2;
  const comboHeaderStatusText = isAllOpen ? "All Open" : "All In Progress";
  const comboHeaderStatusClass = isAllOpen
    ? getStatusBadgeClass(1)
    : getStatusBadgeClass(2);

  const displayRobberies = sortedRobberies.slice(0, 4);
  const remainingCount = sortedRobberies.length - displayRobberies.length;

  return (
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg">
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
                  <Icon icon="svg-spinners:180-ring" className="h-3.5 w-3.5" />
                  Loading region...
                </span>
              )}
            </span>
          </div>

          <div className="mt-2">
            <Button
              size="sm"
              variant="default"
              className="w-full min-w-0"
              disabled={isJoining}
              data-umami-event="Join Server"
              data-umami-event-tracker="Robbery_Tracker"
              data-umami-event-term="Power Combo"
              data-umami-event-jobid={serverId}
              onClick={() => {
                setIsJoining(true);
                const joiningToastId = toast.loading("Joining server...");
                window.setTimeout(() => {
                  toast.dismiss(joiningToastId);
                  setIsJoining(false);
                }, 5000);
                window.location.assign(buildRobloxServerDeepLink(serverId));
              }}
            >
              <Icon icon="heroicons:arrow-top-right-on-square" />
              {isJoining ? "Joining..." : "Join"}
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
