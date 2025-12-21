"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { RobberyData } from "@/hooks/useRobberyTrackerWebSocket";
import toast from "react-hot-toast";
import RobberyPlayersModal from "./RobberyPlayersModal";

interface RobberyCardProps {
  robbery: RobberyData;
}

export default function RobberyCard({ robbery }: RobberyCardProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [planeCountdown, setPlaneCountdown] = useState<string | null>(null);
  const imageUrl = `https://assets.jailbreakchangelogs.xyz/assets/images/robberies/${robbery.marker_name}.webp`;

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
    // Special handling for Mansion robberies
    if (robbery.marker_name === "Mansion") {
      switch (robbery.status) {
        case 1:
          return (
            <div className="bg-status-success/20 text-primary-text flex items-center gap-1.5 rounded-full px-3 py-1">
              <span className="text-sm font-medium">Open</span>
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
          <div className="bg-status-success/20 text-primary-text flex items-center gap-1.5 rounded-full px-3 py-1">
            <span className="text-sm font-medium">Open</span>
          </div>
        );
      case 2:
        return (
          <div className="bg-status-warning/20 text-primary-text flex items-center gap-1.5 rounded-full px-3 py-1">
            <span className="text-sm font-medium">In Progress</span>
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
    <div className="border-border-primary bg-secondary-bg hover:border-border-focus flex flex-col overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
      {/* Image */}
      <div className="bg-secondary-background relative aspect-video w-full shrink-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={robbery.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="flex grow flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-primary-text text-lg font-semibold">
            {robbery.name}
          </h3>
          {getStatusBadge()}
        </div>

        {/* Train Warning Badge */}
        {isTrainNearClose && (
          <div className="bg-status-warning/20 border-status-warning/30 mb-3 flex items-center gap-1.5 rounded-lg border px-3 py-2">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="text-status-warning h-4 w-4"
            />
            <span className="text-primary-text text-sm font-medium">
              Robbery closing soon!
            </span>
          </div>
        )}

        {/* Details */}
        <div className="text-secondary-text space-y-2 text-sm">
          {robbery.metadata?.casino_code && (
            <div className="flex items-center justify-between">
              <span className="text-secondary-text">Casino Code:</span>
              <button
                onClick={() =>
                  handleCopyCasinoCode(robbery.metadata!.casino_code!)
                }
                className="bg-button-info/10 hover:bg-button-info/20 text-primary-accent group flex cursor-pointer items-center gap-2 rounded px-2 py-0.5 font-mono text-base font-semibold transition-colors"
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

          {/* Join Server Button */}
          {jobId && (
            <a
              href={`http://tracker.jailbreakchangelogs.xyz/?jobid=${jobId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover focus:ring-border-focus active:bg-button-info-active mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
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
