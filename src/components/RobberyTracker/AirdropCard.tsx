"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { AirdropData } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import { useServerRegions } from "@/hooks/useServerRegions";
import { ServerRegionData } from "@/hooks/useRobberyTrackerWebSocket";
import { INVENTORY_API_URL } from "@/utils/api";
import { toast } from "sonner";
import { buildRobloxServerDeepLink } from "./deepLink";
import InlineTeamPlayers from "./InlineTeamPlayers";

interface AirdropCardProps {
  airdrop: AirdropData;
}

export default function AirdropCard({ airdrop }: AirdropCardProps) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isMapImageLoading, setIsMapImageLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [despawnCountdown, setDespawnCountdown] = useState<string | null>(null);
  const [regionData, setRegionData] = useState<ServerRegionData | null>(null);
  const { fetchRegionData } = useServerRegions();

  // Get difficulty based on color
  const getDifficulty = (color: string): string => {
    switch (color) {
      case "Brown":
        return "easy";
      case "Blue":
        return "medium";
      case "Red":
        return "hard";
      default:
        return "easy";
    }
  };

  const difficulty = getDifficulty(airdrop.color);
  const locationLower = airdrop.location.toLowerCase();
  const imageUrl = `https://assets.jailbreakchangelogs.xyz/assets/images/robberies/location/${locationLower}/${difficulty}.webp`;

  // Create unique ID for timer subscription
  const jobId = airdrop.server?.job_id || "";
  const timerId = `airdrop-${airdrop.location}-${airdrop.color}-${jobId}-${airdrop.timestamp}`;

  // Use real-time updating relative timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    airdrop.timestamp,
    timerId,
  );

  // Handle despawn countdown
  useEffect(() => {
    if (airdrop.gone_at) {
      const updateCountdown = () => {
        const now = Math.floor(Date.now() / 1000);
        const diff = airdrop.gone_at - now;

        if (diff > 0) {
          // Airdrop hasn't despawned yet - show countdown
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const seconds = diff % 60;

          if (hours > 0) {
            setDespawnCountdown(`${hours}h ${minutes}m ${seconds}s`);
          } else if (minutes > 0) {
            setDespawnCountdown(`${minutes}m ${seconds}s`);
          } else {
            setDespawnCountdown(`${seconds}s`);
          }
        } else {
          // Airdrop has despawned - show relative time
          const absoluteDiff = Math.abs(diff);
          const hours = Math.floor(absoluteDiff / 3600);
          const minutes = Math.floor((absoluteDiff % 3600) / 60);
          const seconds = absoluteDiff % 60;

          if (hours > 0) {
            setDespawnCountdown(`Despawned ${hours}h ${minutes}m ago`);
          } else if (minutes > 0) {
            setDespawnCountdown(`Despawned ${minutes}m ${seconds}s ago`);
          } else {
            setDespawnCountdown(`Despawned ${seconds}s ago`);
          }
        }
      };

      // Update immediately and then every second
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [airdrop.gone_at]);

  useEffect(() => {
    if (jobId) {
      fetchRegionData([jobId]).then((results) => {
        const data = results[jobId];
        if (data) {
          setRegionData(data);
        }
      });
    }
  }, [jobId, fetchRegionData]);

  // Format server time as 12-hour clock with AM/PM
  const formatServerTime = (serverTime: number) => {
    const hours24 = Math.floor(serverTime);
    const minutes = Math.floor((serverTime % 1) * 60);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Get difficulty badge
  const getDifficultyBadge = () => {
    switch (airdrop.color) {
      case "Brown":
        return (
          <div className="text-primary-text inline-flex h-6 items-center gap-1.5 rounded-lg border border-amber-700/30 bg-amber-700/20 px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>Easy</span>
          </div>
        );
      case "Blue":
        return (
          <div className="text-primary-text inline-flex h-6 items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/20 px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>Medium</span>
          </div>
        );
      case "Red":
        return (
          <div className="text-primary-text inline-flex h-6 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/20 px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
            <span>Hard</span>
          </div>
        );
      default:
        return null;
    }
  };

  const players = airdrop.server?.players || [];
  const mapImageUrl = `${INVENTORY_API_URL}/map/airdrop?x=${airdrop.x}&z=${airdrop.z}`;

  return (
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg">
      <div className="flex flex-col gap-3 p-3 sm:flex-row">
        {/* Thumbnail */}
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-white/5 sm:h-16 sm:w-24">
          <Image
            src={imageUrl}
            alt={`${airdrop.color} Airdrop at ${airdrop.location}`}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-primary-text min-w-0 flex-1 truncate text-base font-semibold">
              {airdrop.location.replace(/([A-Z])/g, " $1").trim()} Airdrop
            </h3>
            <div className="shrink-0">{getDifficultyBadge()}</div>
          </div>

          {/* Status */}
          {despawnCountdown && (
            <div className="text-secondary-text mt-0.5 flex items-center gap-2 text-xs">
              <Icon icon="heroicons:clock" className="h-4 w-4 shrink-0" />
              <span className="text-primary-text font-mono font-semibold tabular-nums">
                {despawnCountdown.includes("Despawned")
                  ? despawnCountdown
                  : `Despawns in ${despawnCountdown}`}
              </span>
            </div>
          )}

          {/* Server time */}
          <div className="text-secondary-text mt-1 flex items-center gap-2 text-xs">
            <Icon icon="heroicons:clock" className="h-4 w-4 shrink-0" />
            <span className="text-primary-text font-mono tabular-nums">
              {formatServerTime(airdrop.server_time)}
            </span>
          </div>

          <InlineTeamPlayers players={players} className="mt-1" />

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

          {/* Actions */}
          <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
            {jobId ? (
              <Button
                size="sm"
                variant="default"
                className="w-full min-w-0"
                disabled={isJoining}
                data-umami-event="Join Server"
                data-umami-event-tracker="Airdrop_Tracker"
                data-umami-event-term={`${airdrop.color} Airdrop`}
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

            <Button
              size="sm"
              onClick={() => {
                setIsMapImageLoading(true);
                setIsMapModalOpen(true);
              }}
              variant="secondary"
              className="w-full min-w-0"
              data-umami-event="View Airdrop Map"
              data-umami-event-location={airdrop.location}
            >
              <Icon icon="heroicons:map-pin" />
              Location
            </Button>
          </div>
        </div>
      </div>

      <div className="border-border-card border-t px-3 py-2">
        <div className="text-secondary-text text-center text-xs font-medium tabular-nums">
          Logged {relativeTime || "Just now"}
        </div>
      </div>

      {/* Map Modal */}
      <Dialog
        open={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        className="relative z-[3000]"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border shadow-xl">
            <div className="border-border-card flex items-center justify-between border-b px-6 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-primary-text truncate text-xl font-semibold">
                    {airdrop.location.replace(/([A-Z])/g, " $1").trim()} Airdrop
                  </h2>
                  {getDifficultyBadge()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                aria-label="Close"
                className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="relative">
                {isMapImageLoading && (
                  <div className="bg-secondary-bg/40 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <div className="text-secondary-text inline-flex items-center gap-2 text-sm font-medium">
                      <Icon icon="svg-spinners:180-ring" className="h-5 w-5" />
                      Generating map...
                    </div>
                  </div>
                )}
                <Image
                  src={mapImageUrl}
                  alt="Airdrop Map Location"
                  width={1200}
                  height={800}
                  className="h-auto w-full rounded-lg shadow-2xl"
                  onLoad={() => setIsMapImageLoading(false)}
                  onError={() => setIsMapImageLoading(false)}
                />
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
