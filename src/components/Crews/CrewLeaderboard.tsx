"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CrewLeaderboardEntry as CrewLeaderboardEntryType } from "@/utils/api";
import { RobloxUser } from "@/types";
import { fetchMissingRobloxData } from "@/app/inventories/actions";
import localFont from "next/font/local";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "../UI/IconWrapper";
import { useDebounce } from "@/hooks/useDebounce";

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

interface CrewLeaderboardProps {
  leaderboard: CrewLeaderboardEntryType[];
  currentSeason: number;
}

export default function CrewLeaderboard({
  leaderboard,
  currentSeason,
}: CrewLeaderboardProps) {
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState<Record<string, string>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Progressive loading of missing user data
  const fetchMissingUserData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter((id) => !robloxUsers[id]);

      if (missingIds.length === 0) return;

      try {
        const result = await fetchMissingRobloxData(missingIds);

        // Update state with new user data
        if (result.userData && typeof result.userData === "object") {
          setRobloxUsers((prev) => ({ ...prev, ...result.userData }));
        }

        // Update state with new avatar data
        if (result.avatarData && typeof result.avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...result.avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch missing user data:", error);
      }
    },
    [robloxUsers],
  );

  // Load all crew data
  useEffect(() => {
    if (leaderboard.length === 0) return;

    const userIdsToLoad = leaderboard.map((crew) =>
      crew.OwnerUserId.toString(),
    );

    // Fetch user data for all crew owners
    fetchMissingUserData(userIdsToLoad);
  }, [leaderboard, fetchMissingUserData]);

  // Filter crews based on search term
  const filteredLeaderboard = leaderboard.filter((crew) => {
    if (!debouncedSearchTerm) return true;

    const searchLower = debouncedSearchTerm.toLowerCase();
    const crewName = crew.ClanName.toLowerCase();
    const ownerId = crew.OwnerUserId.toString();
    const owner = robloxUsers[ownerId];
    const ownerName =
      owner?.displayName?.toLowerCase() || owner?.name?.toLowerCase() || "";

    return crewName.includes(searchLower) || ownerName.includes(searchLower);
  });

  // Helper function to get user display name
  const getUserDisplay = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.displayName || user?.name || `User ${userId}`;
  };

  // Helper function to get username
  const getUsername = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.name || userId;
  };

  // Helper function to get user avatar
  const getUserAvatar = (userId: string) => {
    return robloxAvatars[userId] || null;
  };

  // Helper function to format rating
  const formatRating = (rating: number) => {
    return Math.round(rating).toLocaleString();
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-primary-text mb-4 text-xl font-bold">
          Crew Leaderboard
        </h2>
        <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 shadow-sm">
          <p className="text-secondary-text py-8 text-center">
            No crew data available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Crew Leaderboard ({filteredLeaderboard.length})
        {currentSeason !== 19 && (
          <span className="text-secondary-text ml-2 text-sm font-normal">
            - Season {currentSeason}
          </span>
        )}
      </h2>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search crews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>
      </div>

      {/* Historical Season Notice */}
      {currentSeason !== 19 && (
        <div className="bg-secondary-bg border-border-primary mb-4 rounded-lg border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-primary-text flex items-center gap-2">
              <Icon icon="mdi:clock" className="h-5 w-5" inline={true} />
              <span className="font-medium">Historical Data</span>
            </div>
            <Link
              href="/crews"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-block w-fit rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Go to Current Season
            </Link>
          </div>
          <p className="text-secondary-text mt-2 text-sm">
            This is historical data from Season {currentSeason}.
          </p>
        </div>
      )}

      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 shadow-sm">
        <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
          {filteredLeaderboard.map((crew, crewIndex) => {
            // The API data is already sorted by rating, so the position in the array is the rank
            // We need to find the original position in the full leaderboard to maintain proper ranking
            const originalIndex = leaderboard.findIndex((c) => {
              if (crew.ClanId && c.ClanId) {
                // If both have ClanId, match by that
                return c.ClanId === crew.ClanId;
              } else if (!crew.ClanId && !c.ClanId) {
                // If neither has ClanId, match by name and owner
                return (
                  c.ClanName === crew.ClanName &&
                  c.OwnerUserId === crew.OwnerUserId
                );
              } else {
                // One has ClanId, one doesn't - match by name and owner
                return (
                  c.ClanName === crew.ClanName &&
                  c.OwnerUserId === crew.OwnerUserId
                );
              }
            });

            // Use the original index if found, otherwise fall back to current position
            const finalIndex = originalIndex >= 0 ? originalIndex : crewIndex;

            return (
              <CrewLeaderboardEntry
                key={crew.ClanId || `crew_${crewIndex}`}
                crew={crew}
                index={finalIndex}
                getUserDisplay={getUserDisplay}
                getUsername={getUsername}
                getUserAvatar={getUserAvatar}
                formatRating={formatRating}
                currentSeason={currentSeason}
              />
            );
          })}

          {filteredLeaderboard.length === 0 && searchTerm && (
            <div className="py-8 text-center">
              <p className="text-secondary-text">
                No crews found matching &quot;{searchTerm}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CrewLeaderboardEntryProps {
  crew: CrewLeaderboardEntryType;
  index: number;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string | null;
  formatRating: (rating: number) => string;
  currentSeason: number;
}

function CrewLeaderboardEntry({
  crew,
  index,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  formatRating,
  currentSeason,
}: CrewLeaderboardEntryProps) {
  const ownerId = crew.OwnerUserId.toString();
  const displayName = getUserDisplay(ownerId);
  const username = getUsername(ownerId);
  const avatarUrl = getUserAvatar(ownerId);

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-6 transition-colors sm:flex-row sm:items-center bg-primary-bg ${
        index <= 2 ? "" : "border-border-primary hover:border-border-focus"
      }`}
      style={{
        ...(index === 0 && {
          background:
            "linear-gradient(to right, hsl(45, 100%, 50%, 0.2), hsl(45, 100%, 45%, 0.2))",
          borderColor: "hsl(45, 100%, 50%, 0.5)",
        }),
        ...(index === 1 && {
          background:
            "linear-gradient(to right, hsl(0, 0%, 75%, 0.2), hsl(0, 0%, 65%, 0.2))",
          borderColor: "hsl(0, 0%, 75%, 0.5)",
        }),
        ...(index === 2 && {
          background:
            "linear-gradient(to right, hsl(30, 100%, 50%, 0.2), hsl(30, 100%, 45%, 0.2))",
          borderColor: "hsl(30, 100%, 50%, 0.5)",
        }),
      }}
    >
      {/* Rank Badge */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold ${
          index <= 2 ? "text-gray-800" : "bg-button-info text-form-button-text"
        }`}
        style={{
          ...(index === 0 && {
            background:
              "linear-gradient(to right, hsl(45, 100%, 50%), hsl(45, 100%, 45%))",
          }),
          ...(index === 1 && {
            background:
              "linear-gradient(to right, hsl(0, 0%, 75%), hsl(0, 0%, 65%))",
          }),
          ...(index === 2 && {
            background:
              "linear-gradient(to right, hsl(30, 100%, 50%), hsl(30, 100%, 45%))",
          }),
        }}
      >
        {index + 1}
      </div>

      {/* Crew Flag with Owner Avatar */}
      <div className="relative h-20 w-32 overflow-hidden rounded">
        <Image
          src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
          alt="Crew flag"
          width={128}
          height={80}
          className="h-full w-full object-cover"
        />
        {avatarUrl && (
          <div className="absolute inset-0 flex items-center justify-start pl-2">
            <Image
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              width={56}
              height={56}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Crew Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3
            className={`text-primary-text text-lg break-words sm:text-xl md:text-2xl lg:text-3xl ${bangers.className}`}
          >
            <a
              href={`https://www.roblox.com/users/${crew.OwnerUserId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover transition-colors"
            >
              {username}
            </a>
            &apos;s {crew.ClanName}
          </h3>
        </div>
      </div>

      {/* Stats and View Crew Button */}
      <div className="flex items-center justify-between gap-6">
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-primary-text text-lg font-semibold">
              {formatRating(crew.Rating)}
            </div>
            <div className="text-secondary-text text-xs">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-primary-text text-lg font-semibold">
              {crew.BattlesPlayed}
            </div>
            <div className="text-secondary-text text-xs">Battles</div>
          </div>
        </div>

        {/* View Crew Button - positioned on the right side */}
        <Link
          href={`/crews/${index + 1}${currentSeason !== 19 ? `?season=${currentSeason}` : ""}`}
          className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-block w-fit rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          View Crew
        </Link>
      </div>
    </div>
  );
}
