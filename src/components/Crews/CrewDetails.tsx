"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CrewLeaderboardEntry as CrewLeaderboardEntryType } from "@/utils/api";
import { RobloxUser } from "@/types";
import { fetchMissingRobloxData } from "@/app/inventories/actions";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import Link from "next/link";

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
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState<Record<string, string>>(
    {},
  );

  // Load all crew member data
  useEffect(() => {
    const userIdsToLoad = crew.MemberUserIds.map((userId) => userId.toString());

    // Fetch user data for all crew members
    const fetchAllUserData = async () => {
      try {
        const result = await fetchMissingRobloxData(userIdsToLoad);

        // Update state with new user data
        if (result.userData && typeof result.userData === "object") {
          setRobloxUsers((prev) => ({ ...prev, ...result.userData }));
        }

        // Update state with new avatar data
        if (result.avatarData && typeof result.avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...result.avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchAllUserData();
  }, [crew.MemberUserIds]); // Only depend on crew.MemberUserIds, not robloxUsers

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
    const now = Date.now();
    const lastBattle = utc * 1000; // Convert to milliseconds
    const diffMs = now - lastBattle;
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
      {/* Historical Season Notice */}
      {currentSeason !== 19 && (
        <div className="rounded-lg border border-blue-700/30 bg-blue-900/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-blue-200">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Historical Data</span>
            </div>
            <Link
              href="/crews"
              className="inline-block w-fit rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
            >
              Go to Current Season
            </Link>
          </div>
          <p className="mt-2 text-sm text-blue-100">
            This is historical data from Season {currentSeason}.
          </p>
        </div>
      )}

      {/* Crew Header with Flag, Rank, and Info */}
      <div
        className={`rounded-lg border p-4 sm:p-6 ${
          rank === 1
            ? "border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20"
            : rank === 2
              ? "border-gray-300/50 bg-gradient-to-r from-gray-400/20 to-gray-500/20"
              : rank === 3
                ? "border-amber-500/50 bg-gradient-to-r from-amber-600/20 to-amber-700/20"
                : "border-[#2E3944] bg-[#212A31]"
        }`}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {/* Crew Flag with Owner Avatar */}
          <div className="relative h-28 w-40 flex-shrink-0 overflow-hidden rounded sm:h-32 sm:w-48">
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
              alt="Crew flag"
              width={192}
              height={128}
              className="h-full w-full object-cover"
            />
            {(() => {
              const ownerAvatarUrl = getUserAvatar(crew.OwnerUserId.toString());
              return ownerAvatarUrl ? (
                <div className="absolute inset-0 flex items-center justify-start pl-3 sm:pl-4">
                  <Image
                    src={ownerAvatarUrl}
                    alt={`${getUserDisplay(crew.OwnerUserId.toString())}'s avatar`}
                    width={48}
                    height={48}
                    className="rounded-full shadow-lg sm:h-16 sm:w-16"
                  />
                </div>
              ) : null;
            })()}
          </div>

          {/* Crew Info with Rank */}
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div
                className={`text-4xl font-bold ${inter.className} ${
                  rank === 1
                    ? "text-yellow-400"
                    : rank === 2
                      ? "text-gray-300"
                      : rank === 3
                        ? "text-amber-500"
                        : "text-blue-300"
                }`}
              >
                #{rank}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-3">
              <h2
                className={`${bangers.className} text-2xl break-words text-white sm:text-3xl lg:text-4xl xl:text-5xl`}
              >
                {getUsername(crew.OwnerUserId.toString())}&apos;s{" "}
                {crew.ClanName}
              </h2>
              <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                New
              </span>
            </div>
            {currentSeason !== 19 && (
              <p className="text-sm text-gray-400">
                Season {currentSeason} • Historical Data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modern Crew Stats */}
      <div className="rounded-xl border border-[#2E3944] bg-gradient-to-br from-[#212A31] to-[#1A2328] p-6 shadow-lg">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-300">
          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
          Crew Performance
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Rating with gradient background and flag */}
          <div className="relative overflow-hidden rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-2xl font-bold text-white">
                {formatRating(crew.Rating)}
              </div>
              <div className="text-sm font-medium text-blue-300">Rating</div>
            </div>
          </div>

          {/* Battles with animated background and flag */}
          <div className="relative overflow-hidden rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-2xl font-bold text-white">
                {crew.BattlesPlayed}
              </div>
              <div className="text-sm font-medium text-green-300">
                Battles Played
              </div>
            </div>
          </div>

          {/* Win Rate with progress bar and flag */}
          <div className="relative overflow-hidden rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-2xl font-bold text-white">
                {winRate}%
              </div>
              <div className="text-sm font-medium text-yellow-300">
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
          <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-2xl font-bold text-white">
                {crew.MemberUserIds.length}
              </div>
              <div className="text-sm font-medium text-purple-300">Members</div>
            </div>
          </div>

          {/* Last Battle Date with flag */}
          <div className="relative overflow-hidden rounded-lg border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 p-4">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-lg font-bold text-white">
                {lastBattleDate}
              </div>
              <div className="text-sm font-medium text-indigo-300">
                Last Battle
              </div>
              <div className="mt-1 text-xs text-indigo-200">
                {timeSinceLastBattle}
              </div>
            </div>
          </div>

          {/* Battle Stats Summary with flag */}
          <div className="relative overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/20 to-pink-500/20 p-4">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="mb-1 text-lg font-bold text-white">
                {crew.BattlesWon}
              </div>
              <div className="text-sm font-medium text-red-300">
                Battles Won
              </div>
              <div className="mt-1 text-xs text-red-200">
                of {crew.BattlesPlayed} total
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="mt-6 border-t border-[#37424D] pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-[#37424D] bg-[#2E3944] p-3">
              <span className="text-sm text-gray-200">Win/Loss Ratio</span>
              <span className="font-semibold text-white">
                {crew.BattlesPlayed > 0
                  ? `${crew.BattlesWon}-${crew.BattlesPlayed - crew.BattlesWon}`
                  : "0-0"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#37424D] bg-[#2E3944] p-3">
              <span className="text-sm text-gray-200">Avg Rating</span>
              <span className="font-semibold text-white">
                {formatRating(crew.Rating)}
              </span>
            </div>
            {/* Only show Activity for current season */}
            {currentSeason === 19 && (
              <div className="flex items-center justify-between rounded-lg border border-[#37424D] bg-[#2E3944] p-3">
                <span className="text-sm text-gray-200">Activity</span>
                <span
                  className={`font-semibold ${timeSinceLastBattle.includes("d") && parseInt(timeSinceLastBattle.split("d")[0]) > 14 ? "text-red-400" : "text-green-400"}`}
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
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-100">
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
    <div className="flex items-center gap-2 rounded-lg border border-[#37424D] bg-[#2E3944] p-3 transition-colors hover:bg-[#37424D] sm:gap-3">
      {/* Member Number */}
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#37424D] text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
        {index + 1}
      </div>

      {/* Member Avatar */}
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          width={24}
          height={24}
          className="flex-shrink-0 rounded-full sm:h-8 sm:w-8"
        />
      )}

      {/* Member Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <a
            href={`https://www.roblox.com/users/${memberId}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 sm:text-base"
          >
            {displayName}
          </a>
          {username && (
            <span className="truncate text-xs text-gray-300 sm:text-sm">
              (@{username})
            </span>
          )}
          {isOwner && (
            <span className="w-fit rounded-full bg-[#5865F2] px-2 py-1 text-xs font-medium text-white">
              Owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
