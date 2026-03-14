"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { RobberyData } from "@/hooks/useRobberyTrackerWebSocket";
import { useServerRegions } from "@/hooks/useServerRegions";
import { toast } from "sonner";
import RobberyPlayersModal from "./RobberyPlayersModal";
import { buildRobloxServerDeepLink } from "./deepLink";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RobberyCardProps {
  robbery: RobberyData;
}

export default function RobberyCard({ robbery }: RobberyCardProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [planeCountdown, setPlaneCountdown] = useState<string | null>(null);
  const [casinoCountdown, setCasinoCountdown] = useState<string | null>(null);
  const [regionData, setRegionData] = useState(robbery.region_data || null);

  const { fetchRegionData } = useServerRegions();

  // Map marker_name to image name (for cases where image name differs from marker_name)
  const getImageName = (markerName: string): string => {
    if (markerName === "MoneyTruck") return "Bank Truck";
    return markerName;
  };

  // Map marker_name to display name (override the name from API if needed)
  const getDisplayName = (markerName: string, apiName: string): string => {
    if (markerName === "MoneyTruck") return "Bank Truck";
    return apiName;
  };

  const imageName = getImageName(robbery.marker_name);
  const displayName = getDisplayName(robbery.marker_name, robbery.name);
  const imageUrl = `https://assets.jailbreakchangelogs.xyz/assets/images/robberies/${imageName}.webp`;

  // Create unique ID for timer subscription (same pattern as card key)
  const jobId = robbery.server?.job_id || robbery.job_id;
  const timerId = `robbery-${robbery.marker_name}-${jobId}-${robbery.timestamp}`;

  // Use real-time updating relative timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    robbery.timestamp,
    timerId,
  );

  // Check if this is a train with high progress
  const isTrainNearClose =
    (robbery.marker_name === "TrainPassenger" ||
      robbery.marker_name === "TrainCargo") &&
    robbery.progress !== null &&
    robbery.progress > 0.6;

  useEffect(() => {
    const regionId = robbery.region_id || jobId;
    if (regionId) {
      fetchRegionData([regionId]).then((results) => {
        const data = results[regionId];
        if (data) {
          setRegionData(data);
        }
      });
    }
  }, [jobId, robbery.region_id, fetchRegionData]);

  // Handle cargo plane countdown
  useEffect(() => {
    if (robbery.marker_name === "CargoPlane" && robbery.metadata?.plane_time) {
      const planeTime = robbery.metadata.plane_time;

      const updateCountdown = () => {
        const now = Math.floor(Date.now() / 1000);
        const diff = planeTime - now;

        if (diff > 0) {
          // Plane hasn't flown off yet - show countdown
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const seconds = diff % 60;

          if (hours > 0) {
            setPlaneCountdown(`${hours}h ${minutes}m ${seconds}s`);
          } else if (minutes > 0) {
            setPlaneCountdown(`${minutes}m ${seconds}s`);
          } else {
            setPlaneCountdown(`${seconds}s`);
          }
        } else {
          // Plane has flown off - show relative time
          const absoluteDiff = Math.abs(diff);
          const hours = Math.floor(absoluteDiff / 3600);
          const minutes = Math.floor((absoluteDiff % 3600) / 60);
          const seconds = absoluteDiff % 60;

          if (hours > 0) {
            setPlaneCountdown(`Departed ${hours}h ${minutes}m ago`);
          } else if (minutes > 0) {
            setPlaneCountdown(`Departed ${minutes}m ${seconds}s ago`);
          } else {
            setPlaneCountdown(`Departed ${seconds}s ago`);
          }
        }
      };

      // Update immediately and then every second
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [robbery.marker_name, robbery.metadata]);

  // Handle casino countdown
  useEffect(() => {
    if (
      robbery.marker_name === "Casino" &&
      robbery.status === 2 &&
      robbery.metadata?.casino_time
    ) {
      const casinoTime = robbery.metadata.casino_time;

      const updateCountdown = () => {
        const now = Math.floor(Date.now() / 1000);
        const diff = casinoTime - now;

        if (diff > 0) {
          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;

          if (minutes > 0) {
            setCasinoCountdown(`${minutes}m ${seconds}s`);
          } else {
            setCasinoCountdown(`${seconds}s`);
          }
        } else {
          setCasinoCountdown("0s");
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [robbery.marker_name, robbery.status, robbery.metadata]);

  // Format server time as 12-hour clock with AM/PM (e.g., 2.24 -> 02:14 AM, 20.56 -> 08:34 PM)
  const formatServerTime = (serverTime: number) => {
    const hours24 = Math.floor(serverTime);
    const minutes = Math.floor((serverTime % 1) * 60);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Handle casino code copy
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

  const isValidCasinoCode = (code: string | null | undefined) =>
    typeof code === "string" && /^\d+$/.test(code.trim());

  // Get status badge
  const getStatusBadge = () => {
    if (isTrainNearClose) {
      return (
        <div className="text-primary-text border-status-warning/30 bg-status-warning/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
          <span>Ends Soon</span>
        </div>
      );
    }

    // Special handling for Mansion robberies
    if (robbery.marker_name === "Mansion") {
      switch (robbery.status) {
        case 1:
          return (
            <div className="text-primary-text border-status-success/30 bg-status-success/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
              <span>Open</span>
            </div>
          );
        case 2:
          return (
            <div className="text-primary-text border-status-success/30 bg-status-success/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
              <span>Ready to Open</span>
            </div>
          );
        default:
          return (
            <div className="flex items-center gap-1.5 rounded-full bg-gray-500/20 px-3 py-1 text-gray-400">
              <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
              <span className="text-sm font-medium">Unknown</span>
            </div>
          );
      }
    }

    // Default handling for other robberies
    switch (robbery.status) {
      case 1:
        if (robbery.marker_name === "CargoPlane" && planeCountdown) {
          return (
            <div className="text-primary-text border-status-warning/30 bg-status-warning/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
              <span>
                {planeCountdown.includes("Departed")
                  ? planeCountdown
                  : `Departs in ${planeCountdown}`}
              </span>
            </div>
          );
        }
        return (
          <div className="text-primary-text border-status-success/30 bg-status-success/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>Open</span>
          </div>
        );
      case 2:
        return (
          <div className="text-primary-text border-status-warning/30 bg-status-warning/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>Active</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-gray-500/20 px-3 py-1 text-gray-400">
            <Icon icon="heroicons-outline:check-circle" className="h-4 w-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-gray-500/20 px-3 py-1 text-gray-400">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            <span className="text-sm font-medium">Unknown</span>
          </div>
        );
    }
  };

  const players = robbery.server?.players || [];

  return (
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg">
      <div className="flex flex-col gap-3 p-3 sm:flex-row">
        {/* Thumbnail */}
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-white/5 sm:h-16 sm:w-24">
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-primary-text min-w-0 flex-1 truncate text-base font-semibold">
              {displayName}
            </h3>
            <div className="shrink-0">{getStatusBadge()}</div>
          </div>

          {/* Server time */}
          <div className="text-secondary-text mt-0.5 flex items-center gap-2 text-xs">
            <Icon icon="heroicons:clock" className="h-4 w-4 shrink-0" />
            <span className="text-primary-text font-mono tabular-nums">
              {formatServerTime(robbery.server_time)}
            </span>
          </div>

          {/* Region */}
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

          {/* Casino extras (compact row) */}
          {(robbery.metadata?.casino_code ||
            (robbery.marker_name === "Casino" &&
              robbery.status === 2 &&
              robbery.metadata?.casino_time &&
              casinoCountdown)) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {robbery.metadata?.casino_code &&
                (isValidCasinoCode(robbery.metadata.casino_code) ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          handleCopyCasinoCode(robbery.metadata!.casino_code!)
                        }
                        className="text-primary-text border-button-info/30 bg-button-info/20 hover:bg-button-info/30 group inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs leading-none font-medium shadow-2xl backdrop-blur-xl transition-colors"
                      >
                        Code: {robbery.metadata.casino_code}
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
                      Code not available due to a {displayName} rendering issue
                    </TooltipContent>
                  </Tooltip>
                ))}

              {robbery.marker_name === "Casino" &&
                robbery.status === 2 &&
                robbery.metadata?.casino_time &&
                casinoCountdown && (
                  <span className="text-secondary-text inline-flex items-center gap-1.5">
                    <Icon icon="heroicons:hourglass" className="h-4 w-4" />
                    <span>
                      Closes in{" "}
                      <span className="text-primary-text font-mono font-semibold tabular-nums">
                        {casinoCountdown}
                      </span>
                    </span>
                  </span>
                )}
            </div>
          )}

          {/* Actions */}
          {(jobId || players.length > 0) && (
            <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
              {jobId ? (
                <Button
                  size="sm"
                  variant="default"
                  className={
                    players.length > 0
                      ? "w-full min-w-0"
                      : "col-span-2 w-full min-w-0"
                  }
                  disabled={isJoining}
                  data-umami-event="Join Server"
                  data-umami-event-tracker={
                    robbery.marker_name === "Mansion"
                      ? "Mansion_Tracker"
                      : "Robbery_Tracker"
                  }
                  data-umami-event-term={displayName}
                  data-umami-event-jobid={jobId}
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
                  <Icon icon="heroicons:arrow-top-right-on-square" />
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              ) : (
                <div />
              )}

              {players.length > 0 ? (
                <Button
                  size="sm"
                  onClick={() => setIsPlayersModalOpen(true)}
                  variant="secondary"
                  className="w-full min-w-0"
                >
                  <Icon icon="heroicons-outline:users" />
                  {players.length} Players
                </Button>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-border-card border-t px-3 py-2">
        <div className="text-secondary-text text-center text-xs font-medium tabular-nums">
          Logged {relativeTime || "Just now"}
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
