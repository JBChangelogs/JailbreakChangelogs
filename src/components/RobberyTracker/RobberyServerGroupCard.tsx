"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import {
  type RobberyData,
  type ServerRegionData,
} from "@/hooks/useRobberyTrackerWebSocket";
import { useServerRegions } from "@/hooks/useServerRegions";
import { toast } from "sonner";
import { buildRobloxServerDeepLink } from "./deepLink";
import InlineTeamPlayers from "./InlineTeamPlayers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRobberyTrackerLastJoinedServer } from "@/hooks/useRobberyTrackerLastJoinedServer";
import { cn } from "@/lib/utils";

const ROBBERY_IMAGE_PRIORITY: string[] = [
  "Jewelry",
  "TrainCargo",
  "PowerPlant",
  "Museum",
  "Casino",
  "Tomb",
  "MoneyTruck",
  "TrainPassenger",
  "CargoPlane",
  "Bank",
  "Bank2",
  "OilRig",
];

function robberyMarkerToImageName(markerName: string): string {
  if (markerName === "MoneyTruck") return "Bank Truck";
  return markerName;
}

function robberyMarkerToDisplayName(
  markerName: string,
  apiName: string,
): string {
  if (markerName === "MoneyTruck") return "Bank Truck";
  return apiName;
}

function getStatusBadgeClass(status: number) {
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
}

function getStatusText(status: number) {
  switch (status) {
    case 1:
      return "Open";
    case 2:
      return "Active";
    case 3:
      return "Completed";
    default:
      return "Unknown";
  }
}

function formatServerTime(serverTime: number) {
  const hours24 = Math.floor(serverTime);
  const minutes = Math.floor((serverTime % 1) * 60);
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

const isValidCasinoCode = (code: string | null | undefined) =>
  typeof code === "string" && /^\d+$/.test(code.trim());

export default function RobberyServerGroupCard({
  serverId,
  robberies,
  regionData: externalRegionData,
  useExternalRegionData = false,
  onRegionData,
}: {
  serverId: string;
  robberies: RobberyData[];
  regionData?: ServerRegionData | null;
  useExternalRegionData?: boolean;
  onRegionData?: (jobId: string, data: ServerRegionData | null) => void;
}) {
  const [isJoining, setIsJoining] = useState(false);
  const [regionData, setRegionData] = useState<ServerRegionData | null>(null);
  const { fetchRegionData } = useServerRegions();
  const { lastJoined, setLastJoined } = useRobberyTrackerLastJoinedServer();
  const isLastJoined = Boolean(
    serverId && lastJoined?.kind === "grouped" && lastJoined.jobId === serverId,
  );
  const showLastJoinedState = isLastJoined && !isJoining;
  const lastJoinedRelative = useOptimizedRealTimeRelativeDate(
    isLastJoined ? lastJoined?.joinedAt : null,
    `grouped-last-joined-${serverId || "unknown"}`,
  );

  const latestTimestamp = useMemo(
    () => Math.max(...robberies.map((r) => r.timestamp)),
    [robberies],
  );
  const timerId = `server-group-${serverId}-${latestTimestamp}`;
  const relativeTime = useOptimizedRealTimeRelativeDate(
    latestTimestamp,
    timerId,
  );

  const representative = robberies[0];
  const players = representative?.server?.players || [];

  const uniqueRobberies = useMemo(() => {
    const byMarker = new Map<string, RobberyData>();
    for (const robbery of robberies) {
      const existing = byMarker.get(robbery.marker_name);
      if (!existing || robbery.timestamp > existing.timestamp) {
        byMarker.set(robbery.marker_name, robbery);
      }
    }
    return Array.from(byMarker.values());
  }, [robberies]);

  const sortedUniqueRobberies = useMemo(() => {
    const popularityIndex = (marker: string) => {
      const i = ROBBERY_IMAGE_PRIORITY.indexOf(marker);
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    };

    const statusIndex = (status: number) => {
      if (status === 1) return 0; // Open
      if (status === 2) return 1; // Active
      return 2;
    };

    return [...uniqueRobberies].sort((a, b) => {
      const statusDiff = statusIndex(a.status) - statusIndex(b.status);
      if (statusDiff !== 0) return statusDiff;

      const popularityDiff =
        popularityIndex(a.marker_name) - popularityIndex(b.marker_name);
      if (popularityDiff !== 0) return popularityDiff;

      return b.timestamp - a.timestamp;
    });
  }, [uniqueRobberies]);

  const prioritizedImages = useMemo(() => {
    return sortedUniqueRobberies.slice(0, 4).map((robbery) => {
      const imageName = robberyMarkerToImageName(robbery.marker_name);
      const imageUrl = `https://assets.jailbreakchangelogs.xyz/assets/images/robberies/${imageName}.webp`;
      const alt = robberyMarkerToDisplayName(robbery.marker_name, robbery.name);
      return { imageUrl, alt };
    });
  }, [sortedUniqueRobberies]);

  const chipRobberies = useMemo(
    () => sortedUniqueRobberies.slice(0, 4),
    [sortedUniqueRobberies],
  );
  const remainingChipCount = Math.max(0, sortedUniqueRobberies.length - 4);
  const remainingRobberies = useMemo(
    () => sortedUniqueRobberies.slice(4),
    [sortedUniqueRobberies],
  );

  const casinoRobberyInTop = useMemo(
    () => chipRobberies.find((robbery) => robbery.marker_name === "Casino"),
    [chipRobberies],
  );

  const handleCopyCasinoCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Casino code ${code} copied!`, {
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy casino code:", err);
      toast.error("Failed to copy casino code");
    }
  };

  useEffect(() => {
    if (useExternalRegionData) return;
    if (!serverId) return;
    if (regionData) return;
    fetchRegionData([serverId]).then((results) => {
      const data = results[serverId];
      if (data) {
        setRegionData(data);
        onRegionData?.(serverId, data);
      }
    });
  }, [
    serverId,
    fetchRegionData,
    onRegionData,
    regionData,
    useExternalRegionData,
  ]);

  const displayedRegionData = useExternalRegionData
    ? (externalRegionData ?? null)
    : regionData;

  return (
    <div
      className={cn(
        "border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg",
        showLastJoinedState && "bg-tertiary-bg",
      )}
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row">
        {/* Thumbnail (adaptive layout) */}
        <div className="aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-white/5 sm:aspect-auto sm:h-24 sm:w-40">
          {prioritizedImages.length === 0 ? (
            <div className="bg-tertiary-bg border-border-card flex h-full w-full items-center justify-center border text-sm font-semibold">
              Server
            </div>
          ) : prioritizedImages.length === 1 ? (
            <div className="relative h-full w-full">
              <Image
                src={prioritizedImages[0].imageUrl}
                alt={prioritizedImages[0].alt}
                fill
                className="object-cover"
              />
            </div>
          ) : prioritizedImages.length === 2 ? (
            <div className="grid h-full w-full grid-cols-2 gap-1">
              {prioritizedImages.map((img, idx) => (
                <div
                  key={`${img.imageUrl}-${idx}`}
                  className="bg-tertiary-bg relative h-full w-full overflow-hidden"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : prioritizedImages.length === 3 ? (
            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
              <div className="bg-tertiary-bg relative col-span-1 row-span-2 overflow-hidden">
                <Image
                  src={prioritizedImages[0].imageUrl}
                  alt={prioritizedImages[0].alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-tertiary-bg relative overflow-hidden">
                <Image
                  src={prioritizedImages[1].imageUrl}
                  alt={prioritizedImages[1].alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-tertiary-bg relative overflow-hidden">
                <Image
                  src={prioritizedImages[2].imageUrl}
                  alt={prioritizedImages[2].alt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
              {prioritizedImages.slice(0, 4).map((img, idx) => (
                <div
                  key={`${img.imageUrl}-${idx}`}
                  className="bg-tertiary-bg relative h-full w-full overflow-hidden"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            {chipRobberies.map((robbery) => (
              <span
                key={`${robbery.marker_name}-${robbery.timestamp}`}
                className={`${getStatusBadgeClass(robbery.status)} inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium`}
              >
                <span className="truncate">
                  {robberyMarkerToDisplayName(
                    robbery.marker_name,
                    robbery.name,
                  )}
                </span>
                <span className="text-tertiary-text">•</span>
                <span className="shrink-0">
                  {getStatusText(robbery.status)}
                </span>
              </span>
            ))}
            {remainingChipCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-primary-text border-border-card bg-tertiary-bg inline-flex cursor-help items-center rounded-lg border px-2.5 py-1 text-xs font-medium">
                    +{remainingChipCount} more
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {remainingRobberies.slice(0, 12).map((robbery) => (
                      <div
                        key={`${robbery.marker_name}-${robbery.timestamp}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="max-w-[220px] truncate font-medium">
                          {robberyMarkerToDisplayName(
                            robbery.marker_name,
                            robbery.name,
                          )}
                        </span>
                        <span className="text-tertiary-text">•</span>
                        <span className="font-medium">
                          {getStatusText(robbery.status)}
                        </span>
                      </div>
                    ))}
                    {remainingRobberies.length > 12 && (
                      <div className="text-tertiary-text text-xs">
                        +{remainingRobberies.length - 12} more
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="text-secondary-text mt-2 flex items-center gap-2 text-xs">
            <Icon icon="heroicons:clock" className="h-4 w-4 shrink-0" />
            <span className="text-primary-text font-mono tabular-nums">
              {formatServerTime(representative.server_time)}
            </span>
          </div>

          <InlineTeamPlayers players={players} className="mt-1" />

          <div className="text-secondary-text mt-1 flex items-center gap-2 text-xs">
            <Icon icon="heroicons:map-pin" className="h-4 w-4 shrink-0" />
            <span className="text-primary-text truncate font-medium">
              {displayedRegionData ? (
                `${displayedRegionData.city}, ${displayedRegionData.regionName}, ${displayedRegionData.country}`
              ) : (
                <span className="text-secondary-text inline-flex items-center gap-2">
                  <Icon icon="svg-spinners:180-ring" className="h-3.5 w-3.5" />
                  Loading region...
                </span>
              )}
            </span>
          </div>

          {/* Casino code (only when Crown Jewel is in top 4) */}
          {casinoRobberyInTop?.metadata?.casino_code && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {isValidCasinoCode(casinoRobberyInTop.metadata.casino_code) ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        handleCopyCasinoCode(
                          casinoRobberyInTop.metadata!.casino_code!,
                        )
                      }
                      className="text-primary-text border-button-info/30 bg-button-info/20 hover:bg-button-info/30 group inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs leading-none font-medium shadow-2xl backdrop-blur-xl transition-colors"
                    >
                      Code: {casinoRobberyInTop.metadata.casino_code}
                      <Icon
                        icon="heroicons:clipboard-document"
                        className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Click to copy code</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-primary-text border-border-card bg-tertiary-bg inline-flex h-6 cursor-help items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs leading-none font-medium">
                      Code: ???
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Code not available due to a Crown Jewel rendering issue
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

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
              data-umami-event="Join Server"
              data-umami-event-tracker="Robbery_Tracker_Grouped"
              data-umami-event-term="Grouped_Server"
              data-umami-event-jobid={serverId}
              onClick={() => {
                setIsJoining(true);
                setLastJoined({
                  kind: "grouped",
                  jobId: serverId,
                  joinedAt: Math.floor(Date.now() / 1000),
                  label: "Grouped Server",
                  tracker: "grouped",
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
