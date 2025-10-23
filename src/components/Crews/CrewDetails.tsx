"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CrewLeaderboardEntry as CrewLeaderboardEntryType } from "@/utils/api";
import { RobloxUser } from "@/types";
import { fetchCrewUserData } from "@/app/inventories/actions";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { useQuery } from "@tanstack/react-query";
import { DefaultAvatar } from "@/utils/avatar";

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

const inter = Inter({ subsets: ["latin"] });

interface CrewDetailsProps {
  crew: CrewLeaderboardEntryType;
  rank: number;
  currentSeason: number;
}

export default function CrewDetails({
  crew,
  rank,
  currentSeason,
}: CrewDetailsProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Extract user IDs from crew members
  const userIdsToLoad = crew.MemberUserIds.map((userId) => userId.toString());

  // Use TanStack Query for fetching user data with caching
  const { data: fetchedUserData } = useQuery({
    queryKey: ["crewUserData", userIdsToLoad.sort()],
    queryFn: () => fetchCrewUserData(userIdsToLoad),
    enabled: userIdsToLoad.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });

  // Transform data during render instead of using useEffect
  const robloxUsers: Record<string, RobloxUser> = (() => {
    if (
      fetchedUserData &&
      "userData" in fetchedUserData &&
      typeof fetchedUserData.userData === "object"
    ) {
      return fetchedUserData.userData as Record<string, RobloxUser>;
    }
    return {};
  })();

  const robloxAvatars: Record<string, string> = (() => {
    if (
      fetchedUserData &&
      "avatarData" in fetchedUserData &&
      typeof fetchedUserData.avatarData === "object"
    ) {
      return fetchedUserData.avatarData as Record<string, string>;
    }
    return {};
  })();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Helper function to get user display name
  const getUserDisplay = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.displayName || user?.name || `User ${userId}`;
  };

  // Helper function to get username
  const getUsername = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.name || `User ${userId}`;
  };

  // Helper function to get user avatar
  const getUserAvatar = (userId: string) => {
    const avatarData = robloxAvatars[userId];
    // The processed avatar data is already the imageUrl string
    return avatarData || null;
  };

  // Helper function to format rating
  const formatRating = (rating: number) => {
    return Math.round(rating).toLocaleString();
  };

  // Helper function to calculate win rate
  const getWinRate = (battlesWon: number, battlesPlayed: number) => {
    if (battlesPlayed === 0) return 0;
    return Math.round((battlesWon / battlesPlayed) * 100);
  };

  // Helper function to format last battle date
  const formatLastBattleDate = (utc: number) => {
    try {
      const date = new Date(utc * 1000); // Convert Unix timestamp to milliseconds
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error parsing date:", utc, error);
      return "Unknown";
    }
  };

  // Helper function to get time since last battle
  const getTimeSinceLastBattle = (utc: number) => {
    const lastBattle = utc * 1000; // Convert to milliseconds
    const diffMs = currentTime - lastBattle;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const winRate = getWinRate(crew.BattlesWon, crew.BattlesPlayed);
  const lastBattleDate = formatLastBattleDate(crew.LastBattlePlayedUTC);
  const timeSinceLastBattle = getTimeSinceLastBattle(crew.LastBattlePlayedUTC);

  return (
    <div className="space-y-8">
      {/* Crew Header with Flag, Rank, and Info */}
      <div
        className={`rounded-lg border p-4 sm:p-6 ${
          rank <= 3
            ? ""
            : "bg-secondary-bg border-border-primary hover:border-border-focus"
        }`}
        style={{
          ...(rank === 1 && {
            background:
              "linear-gradient(to right, hsl(45, 100%, 50%, 0.2), hsl(45, 100%, 45%, 0.2))",
            borderColor: "hsl(45, 100%, 50%, 0.5)",
          }),
          ...(rank === 2 && {
            background:
              "linear-gradient(to right, hsl(0, 0%, 75%, 0.2), hsl(0, 0%, 65%, 0.2))",
            borderColor: "hsl(0, 0%, 75%, 0.5)",
          }),
          ...(rank === 3 && {
            background:
              "linear-gradient(to right, hsl(30, 100%, 50%, 0.2), hsl(30, 100%, 45%, 0.2))",
            borderColor: "hsl(30, 100%, 50%, 0.5)",
          }),
        }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {/* Crew Flag with Owner Avatar */}
          <div
            className="relative h-28 w-40 flex-shrink-0 overflow-hidden rounded sm:h-32 sm:w-48"
            suppressHydrationWarning
          >
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
              alt="Crew flag"
              width={192}
              height={128}
              className="h-full w-full object-cover"
            />
            {(() => {
              const ownerAvatarUrl = getUserAvatar(crew.OwnerUserId.toString());
              return (
                <div
                  className="absolute inset-0 flex items-center justify-start pl-3 sm:pl-4"
                  suppressHydrationWarning
                >
                  {ownerAvatarUrl ? (
                    <Image
                      src={ownerAvatarUrl}
                      alt={`${getUserDisplay(crew.OwnerUserId.toString())}'s avatar`}
                      width={48}
                      height={48}
                      className="rounded-full shadow-lg sm:h-16 sm:w-16"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary-bg flex items-center justify-center shadow-lg sm:h-16 sm:w-16">
                      <DefaultAvatar shape="circle" />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Crew Info with Rank */}
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div
                className={`text-4xl font-bold ${inter.className} ${
                  rank <= 3 ? "text-gray-800" : "text-primary-text"
                }`}
                style={{
                  ...(rank === 1 && {
                    background:
                      "linear-gradient(to right, hsl(45, 100%, 50%), hsl(45, 100%, 45%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }),
                  ...(rank === 2 && {
                    background:
                      "linear-gradient(to right, hsl(0, 0%, 75%), hsl(0, 0%, 65%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }),
                  ...(rank === 3 && {
                    background:
                      "linear-gradient(to right, hsl(30, 100%, 50%), hsl(30, 100%, 45%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }),
                }}
              >
                #{rank}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-3">
              <h2
                className={`${bangers.className} text-primary-text text-2xl break-words sm:text-3xl lg:text-4xl xl:text-5xl`}
                suppressHydrationWarning
              >
                {getUsername(crew.OwnerUserId.toString())}&apos;s{" "}
                {crew.ClanName}
              </h2>
            </div>
            {currentSeason !== 19 && (
              <p className="text-secondary-text text-sm">
                Season {currentSeason} • Historical Data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modern Crew Stats */}
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-xl border p-6 shadow-lg">
        <h3 className="text-primary-text mb-6 flex items-center gap-2 text-lg font-semibold">
          <div className="bg-button-info h-2 w-2 rounded-full"></div>
          Crew Performance
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Rating with gradient background and flag */}
          <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border p-4">
            {/* Flag background */}
            <div className="light:opacity-20 absolute inset-0 opacity-5 dark:opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            <div className="relative z-10">
              <div className="text-primary-text mb-1 text-2xl font-bold">
                {formatRating(crew.Rating)}
              </div>
              <div className="text-secondary-text text-sm font-medium">
                Rating
              </div>
            </div>
          </div>

          {/* Battles with animated background and flag */}
          <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border p-4">
            {/* Flag background */}
            <div className="light:opacity-20 absolute inset-0 opacity-5 dark:opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            <div className="relative z-10">
              <div className="text-primary-text mb-1 text-2xl font-bold">
                {crew.BattlesPlayed}
              </div>
              <div className="text-secondary-text text-sm font-medium">
                Battles Played
              </div>
            </div>
          </div>

          {/* Win Rate with progress bar and flag */}
          <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border p-4">
            {/* Flag background */}
            <div className="light:opacity-20 absolute inset-0 opacity-5 dark:opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            <div className="relative z-10">
              <div className="text-primary-text mb-1 text-2xl font-bold">
                {winRate}%
              </div>
              <div className="text-secondary-text text-sm font-medium">
                Win Rate
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/20">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${winRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Members with icon and flag */}
          <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border p-4">
            {/* Flag background */}
            <div className="light:opacity-20 absolute inset-0 opacity-5 dark:opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            <div className="relative z-10">
              <div className="text-primary-text mb-1 text-2xl font-bold">
                {crew.MemberUserIds.length}
              </div>
              <div className="text-secondary-text text-sm font-medium">
                Members
              </div>
            </div>
          </div>

          {/* Last Battle Date with flag */}
          <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border p-4">
            {/* Flag background */}
            <div className="light:opacity-20 absolute inset-0 opacity-5 dark:opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            <div className="relative z-10">
              <div className="text-primary-text mb-1 text-lg font-bold">
                {lastBattleDate}
              </div>
              <div className="text-secondary-text text-sm font-medium">
                Last Battle
              </div>
              <div className="text-tertiary-text mt-1 text-xs">
                {timeSinceLastBattle}
              </div>
            </div>
          </div>

          {/* Battle Stats Summary with flag */}
          <div className="border-border-primary hover:border-border-focus bg-primary-bg relative overflow-hidden rounded-lg border p-4">
            {/* Flag background */}
            <div className="light:opacity-20 absolute inset-0 opacity-5 dark:opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            <div className="relative z-10">
              <div className="text-primary-text mb-1 text-lg font-bold">
                {crew.BattlesWon}
              </div>
              <div className="text-secondary-text text-sm font-medium">
                Battles Won
              </div>
              <div className="text-tertiary-text mt-1 text-xs">
                of {crew.BattlesPlayed} total
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="border-border-primary mt-6 border-t pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border-border-primary bg-primary-bg flex items-center justify-between rounded-lg border p-3">
              <span className="text-secondary-text text-sm">
                Win/Loss Ratio
              </span>
              <span className="text-primary-text font-semibold">
                {crew.BattlesPlayed > 0
                  ? `${crew.BattlesWon}-${crew.BattlesPlayed - crew.BattlesWon}`
                  : "0-0"}
              </span>
            </div>
            <div className="border-border-primary bg-primary-bg flex items-center justify-between rounded-lg border p-3">
              <span className="text-secondary-text text-sm">Avg Rating</span>
              <span className="text-primary-text font-semibold">
                {formatRating(crew.Rating)}
              </span>
            </div>
            {/* Only show Activity for current season */}
            {currentSeason === 19 && (
              <div className="border-border-primary bg-primary-bg flex items-center justify-between rounded-lg border p-3">
                <span className="text-secondary-text text-sm">Activity</span>
                <span
                  className={`font-semibold ${timeSinceLastBattle.includes("d") && parseInt(timeSinceLastBattle.split("d")[0]) > 14 ? "text-button-danger" : "text-button-success"}`}
                >
                  {timeSinceLastBattle.includes("d") &&
                  parseInt(timeSinceLastBattle.split("d")[0]) > 14
                    ? "Inactive"
                    : "Active"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crew Members */}
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 sm:p-6">
        <h2 className="text-primary-text mb-4 text-xl font-bold">
          Crew Members ({crew.MemberUserIds.length})
        </h2>
        <div className="space-y-3">
          {crew.MemberUserIds.sort((a, b) => {
            // Put owner first, then sort by member ID
            if (a === crew.OwnerUserId) return -1;
            if (b === crew.OwnerUserId) return 1;
            return a - b;
          }).map((memberId, index) => (
            <CrewMember
              key={memberId}
              memberId={memberId}
              index={index}
              getUserDisplay={getUserDisplay}
              getUsername={getUsername}
              getUserAvatar={getUserAvatar}
              isOwner={memberId === crew.OwnerUserId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CrewMemberProps {
  memberId: number;
  index: number;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string | null;
  isOwner: boolean;
}

function CrewMember({
  memberId,
  index,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  isOwner,
}: CrewMemberProps) {
  const memberIdStr = memberId.toString();
  const displayName = getUserDisplay(memberIdStr);
  const username = getUsername(memberIdStr);
  const avatarUrl = getUserAvatar(memberIdStr);

  return (
    <div className="border-border-primary hover:border-border-focus bg-primary-bg flex items-center gap-2 rounded-lg border p-3 transition-colors sm:gap-3">
      {/* Member Number */}
      <div className="bg-button-info text-form-button-text flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm">
        {index + 1}
      </div>

      {/* Member Avatar */}
      <div className="flex-shrink-0 rounded-full sm:h-8 sm:w-8 h-6 w-6">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${displayName}'s avatar`}
            width={24}
            height={24}
            className="h-full w-full rounded-full"
            suppressHydrationWarning
          />
        ) : (
          <div className="h-full w-full rounded-full bg-primary-bg flex items-center justify-center">
            <DefaultAvatar shape="circle" />
          </div>
        )}
      </div>

      {/* Member Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <a
            href={`https://www.roblox.com/users/${memberId}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover truncate text-sm font-medium transition-colors sm:text-base"
            suppressHydrationWarning
          >
            {displayName}
          </a>
          {username && (
            <span
              className="text-secondary-text truncate text-xs sm:text-sm"
              suppressHydrationWarning
            >
              (@{username})
            </span>
          )}
          {isOwner && (
            <span className="bg-button-info text-form-button-text w-fit rounded-full px-2 py-1 text-xs font-medium">
              Owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
