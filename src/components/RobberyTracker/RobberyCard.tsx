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

interface RobberyCardProps {
  robbery: RobberyData;
}

export default function RobberyCard({ robbery }: RobberyCardProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
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
            setPlaneCountdown(`Took off ${hours}h ${minutes}m ago`);
          } else if (minutes > 0) {
            setPlaneCountdown(`Took off ${minutes}m ${seconds}s ago`);
          } else {
            setPlaneCountdown(`Took off ${seconds}s ago`);
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

  // Get status badge
  const getStatusBadge = () => {
    if (isTrainNearClose) {
      return (
        <div className="text-primary-text border-status-warning/30 bg-status-warning/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
          <span>Closing Soon</span>
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
            <div className="bg-button-info/20 text-primary-text flex items-center gap-1.5 rounded-full px-3 py-1">
              <span className="text-sm font-medium">Ready to Open</span>
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
        return (
          <div className="text-primary-text border-status-success/30 bg-status-success/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>Open</span>
          </div>
        );
      case 2:
        return (
          <div className="text-primary-text border-status-warning/30 bg-status-warning/20 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>In Progress</span>
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
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
      {/* Image */}
      <div className="bg-secondary-background relative aspect-video w-full shrink-0 overflow-hidden">
        <Image src={imageUrl} alt={displayName} fill className="object-cover" />
      </div>

      {/* Content */}
      <div className="flex grow flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-primary-text text-lg font-semibold">
            {displayName}
          </h3>
          {getStatusBadge()}
        </div>

        {/* Details */}
        <div className="text-secondary-text space-y-2 text-sm">
          {robbery.metadata?.casino_code && (
            <div className="flex items-center justify-between">
              <span className="text-secondary-text">Casino Code:</span>
              <button
                onClick={() =>
                  handleCopyCasinoCode(robbery.metadata!.casino_code!)
                }
                className="text-primary-text border-button-info/30 bg-button-info/20 hover:bg-button-info/30 group inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs leading-none font-medium shadow-2xl backdrop-blur-xl transition-colors"
                title="Click to copy code"
              >
                {robbery.metadata.casino_code}
                <Icon
                  icon="heroicons:clipboard-document"
                  className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100"
                />
              </button>
            </div>
          )}

          {/* Casino Countdown */}
          {robbery.marker_name === "Casino" &&
            robbery.status === 2 &&
            robbery.metadata?.casino_time &&
            casinoCountdown && (
              <div className="flex items-center justify-between">
                <span className="text-secondary-text">Closes In:</span>
                <span className="text-primary-text font-mono font-semibold">
                  {casinoCountdown}
                </span>
              </div>
            )}

          {/* Cargo Plane Countdown */}
          {robbery.marker_name === "CargoPlane" &&
            robbery.metadata?.plane_time &&
            planeCountdown && (
              <div className="flex items-center justify-between">
                <span className="text-secondary-text">Plane Status:</span>
                <span className="text-primary-text font-mono font-semibold">
                  {planeCountdown.includes("Took off")
                    ? planeCountdown
                    : `Flying off in ${planeCountdown}`}
                </span>
              </div>
            )}

          <div className="flex items-center justify-between">
            <span className="text-secondary-text">Server Time:</span>
            <span className="font-mono">
              {formatServerTime(robbery.server_time)}
            </span>
          </div>

          {/* Region Info */}
          <div className="space-y-1">
            <span className="text-secondary-text text-sm">Region:</span>
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

          {/* Join Server Button */}
          {jobId && (
            <Button asChild variant="default" className="mt-3 w-full">
              <a
                href={`http://tracker.jailbreakchangelogs.xyz/?jobid=${jobId}&utm_campaign=${robbery.marker_name === "Mansion" ? "Mansion_Tracker" : "Robbery_Tracker"}&utm_term=${displayName.replace(/ /g, "+")}&utm_source=website`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon
                  icon="heroicons:arrow-top-right-on-square"
                  className="h-4 w-4"
                />
                Join Server
              </a>
            </Button>
          )}

          {/* View Players Button */}
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
        </div>

        {/* Footer with Last Update */}
        <div className="border-border-card mt-4 border-t pt-3">
          <div className="text-primary-text flex items-center justify-center text-xs font-medium">
            <span>Logged {relativeTime || "Just now"}</span>
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
