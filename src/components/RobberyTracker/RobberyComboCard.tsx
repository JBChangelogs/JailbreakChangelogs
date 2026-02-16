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
import RobberyPlayersModal from "./RobberyPlayersModal";

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
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
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

  return (
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
      <div className="bg-secondary-background relative aspect-video w-full shrink-0 overflow-hidden">
        {comboImageUrl ? (
          <Image
            src={comboImageUrl}
            alt={comboLabel}
            fill
            className="object-cover"
          />
        ) : (
          <div className="bg-tertiary-bg border-border-card text-primary-text flex h-full items-center justify-center border-b text-base font-semibold">
            {comboLabel}
          </div>
        )}
      </div>

      <div className="flex grow flex-col p-4">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-primary-text text-lg font-semibold">
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

        <div className="mb-4 space-y-2">
          {sortedRobberies.map((robbery) => (
            <div
              key={`${robbery.marker_name}-${robbery.timestamp}`}
              className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-primary-text text-sm font-medium">
                {robbery.name}
              </span>
              <span
                className={`${getStatusBadgeClass(robbery.status)} inline-flex h-6 items-center rounded-lg border px-2.5 text-xs font-medium`}
              >
                {getStatusText(robbery.status)}
              </span>
            </div>
          ))}
        </div>

        <div className="text-secondary-text mb-3 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>Server Time:</span>
            <span className="text-primary-text font-mono">
              {formatServerTime(firstRobbery.server_time)}
            </span>
          </div>
          <div className="space-y-1">
            <span>Region:</span>
            <span className="text-primary-text block font-medium">
              {regionData ? (
                `${regionData.city}, ${regionData.regionName}, ${regionData.country}`
              ) : (
                <span className="text-secondary-text inline-flex items-center gap-2">
                  <Icon icon="svg-spinners:180-ring" className="h-3.5 w-3.5" />
                  Loading...
                </span>
              )}
            </span>
          </div>
        </div>

        <Button asChild variant="default" className="mt-auto w-full">
          <a
            href={`http://tracker.jailbreakchangelogs.xyz/?jobid=${serverId}&utm_campaign=Robbery_Tracker&utm_term=Power+Combo&utm_source=website`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon
              icon="heroicons:arrow-top-right-on-square"
              className="h-4 w-4"
            />
            Join Combo Server
          </a>
        </Button>

        {players.length > 0 && (
          <Button
            onClick={() => setIsPlayersModalOpen(true)}
            variant="default"
            className="mt-2 w-full"
          >
            <Icon icon="heroicons-outline:users" className="h-4 w-4" />
            View {players.length} Players
          </Button>
        )}

        <div className="border-border-card mt-4 border-t pt-3">
          <div className="text-primary-text flex items-center justify-center text-xs font-medium">
            <span>Logged {relativeTime || "Just now"}</span>
          </div>
        </div>
      </div>

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
