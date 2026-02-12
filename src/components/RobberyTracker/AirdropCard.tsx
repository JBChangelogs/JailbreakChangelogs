"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { AirdropData } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import RobberyPlayersModal from "./RobberyPlayersModal";
import { useServerRegions } from "@/hooks/useServerRegions";
import { ServerRegionData } from "@/hooks/useRobberyTrackerWebSocket";
import { INVENTORY_API_URL } from "@/utils/api";

interface AirdropCardProps {
  airdrop: AirdropData;
}

export default function AirdropCard({ airdrop }: AirdropCardProps) {
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
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
          <div className="text-primary-text flex items-center gap-1.5 rounded-full bg-amber-700/20 px-3 py-1">
            <span className="text-sm font-medium">Easy</span>
          </div>
        );
      case "Blue":
        return (
          <div className="text-primary-text flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1">
            <span className="text-sm font-medium">Medium</span>
          </div>
        );
      case "Red":
        return (
          <div className="text-primary-text flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1">
            <span className="text-sm font-medium">Hard</span>
          </div>
        );
      default:
        return null;
    }
  };

  const players = airdrop.server?.players || [];
  const mapImageUrl = `${INVENTORY_API_URL}/map/airdrop?x=${airdrop.x}&z=${airdrop.z}`;

  return (
    <div className="border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg">
      {/* Image */}
      <div className="bg-secondary-background relative aspect-video w-full shrink-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={`${airdrop.color} Airdrop at ${airdrop.location}`}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex grow flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-primary-text text-lg font-semibold">
              {airdrop.location.replace(/([A-Z])/g, " $1").trim()} Airdrop
            </h3>
            <p className="text-secondary-text text-sm">{airdrop.color} Crate</p>
          </div>
          {getDifficultyBadge()}
        </div>

        {/* Details */}
        <div className="text-secondary-text space-y-2 text-sm">
          {/* Despawn Countdown */}
          {despawnCountdown && (
            <div className="flex items-center justify-between">
              <span className="text-secondary-text">Status:</span>
              <span className="text-primary-text font-mono font-semibold">
                {despawnCountdown.includes("Despawned")
                  ? despawnCountdown
                  : `Despawns in ${despawnCountdown}`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-secondary-text">Server Time:</span>
            <span className="font-mono">
              {formatServerTime(airdrop.server_time)}
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

          {/* View Map Button */}
          <Button
            onClick={() => setIsMapModalOpen(true)}
            variant="default"
            className="mt-2 w-full"
            data-umami-event="View Airdrop Map"
            data-umami-event-location={airdrop.location}
          >
            <Icon icon="heroicons:map-pin" className="h-4 w-4" />
            View Location
          </Button>

          {/* Join Server Button */}
          {jobId && (
            <Button asChild variant="default" className="mt-2 w-full">
              <a
                href={`http://tracker.jailbreakchangelogs.xyz/?jobid=${jobId}&utm_campaign=Airdrop_Tracker&utm_term=${airdrop.color}+Airdrop&utm_source=website`}
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

      {/* Map Modal */}
      <AnimatePresence>
        {isMapModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMapModalOpen(false)}
          >
            {/* Modal Content */}
            <motion.div
              className="relative max-h-[90vh] max-w-[90vw] p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative">
                <Image
                  src={mapImageUrl}
                  alt="Airdrop Map Location"
                  width={1200}
                  height={800}
                  className="h-auto max-h-[80vh] w-auto max-w-full rounded-lg shadow-2xl"
                />
              </div>

              {/* Caption */}
              <p className="mt-3 text-center text-sm text-gray-300">
                Airdrop Location:{" "}
                {airdrop.location.replace(/([A-Z])/g, " $1").trim()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
