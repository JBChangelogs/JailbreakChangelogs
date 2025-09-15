"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  fetchRobloxUsersBatchLeaderboard,
  fetchRobloxAvatars,
} from "@/utils/api";
import { useDebounce } from "@/hooks/useDebounce";
import MoneyLeaderboardSearch from "./MoneyLeaderboardSearch";
import UserRankDisplay from "./UserRankDisplay";

interface MoneyLeaderboardEntry {
  user_id: string;
  money: number;
}

interface MoneyLeaderboardClientProps {
  initialLeaderboard: MoneyLeaderboardEntry[];
}

export default function MoneyLeaderboardClient({
  initialLeaderboard,
}: MoneyLeaderboardClientProps) {
  const [filteredLeaderboard, setFilteredLeaderboard] =
    useState(initialLeaderboard);
  const [searchTerm, setSearchTerm] = useState("");
  const [userDataMap, setUserDataMap] = useState<
    Record<string, { displayName?: string; name?: string }>
  >({});
  const [avatarDataMap, setAvatarDataMap] = useState<Record<string, string>>(
    {},
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Helper function to format money
  const formatMoney = (money: number) => {
    return new Intl.NumberFormat("en-US").format(money);
  };

  // Load user data and avatars for all users
  useEffect(() => {
    const loadUserData = async () => {
      if (initialLeaderboard.length === 0) return;

      try {
        const userIds = initialLeaderboard.map((user) => user.user_id);

        // Fetch batch user data and avatars
        const [userDataResult, avatarData] = await Promise.all([
          fetchRobloxUsersBatchLeaderboard(userIds),
          fetchRobloxAvatars(userIds),
        ]);

        // Process user data
        let newUserDataMap: Record<
          string,
          { displayName?: string; name?: string }
        > = {};
        if (userDataResult && typeof userDataResult === "object") {
          newUserDataMap = userDataResult;
        }

        // Process avatar data
        const newAvatarDataMap: Record<string, string> = {};
        if (avatarData && typeof avatarData === "object") {
          Object.values(avatarData).forEach(
            (avatar: { targetId?: number; imageUrl?: string }) => {
              if (avatar && avatar.targetId && avatar.imageUrl) {
                newAvatarDataMap[avatar.targetId.toString()] = avatar.imageUrl;
              }
            },
          );
        }

        setUserDataMap(newUserDataMap);
        setAvatarDataMap(newAvatarDataMap);
      } catch (error) {
        console.error(
          "Failed to fetch user data for money leaderboard:",
          error,
        );
      }
    };

    loadUserData();
  }, [initialLeaderboard]);

  // Filter leaderboard based on debounced search term
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredLeaderboard(initialLeaderboard);
      return;
    }

    const filtered = initialLeaderboard.filter((user) => {
      const userData = userDataMap[user.user_id];
      const userDisplay =
        userData?.displayName || userData?.name || `User ${user.user_id}`;
      const username = userData?.name || user.user_id;

      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        userDisplay.toLowerCase().includes(searchLower) ||
        username.toLowerCase().includes(searchLower) ||
        user.user_id.includes(debouncedSearchTerm)
      );
    });

    setFilteredLeaderboard(filtered);
  }, [debouncedSearchTerm, initialLeaderboard, userDataMap]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Truncate very long queries for display purposes
  const MAX_QUERY_DISPLAY_LENGTH = 120;
  const displayQuery =
    searchTerm.length > MAX_QUERY_DISPLAY_LENGTH
      ? `${searchTerm.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
      : searchTerm;

  return (
    <>
      <UserRankDisplay />

      {initialLeaderboard && initialLeaderboard.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-300">
              Money Leaderboard ({filteredLeaderboard.length}
              {searchTerm && ` of ${initialLeaderboard.length}`})
            </h2>
          </div>

          <MoneyLeaderboardSearch onSearch={handleSearch} />

          <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
            <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
              {filteredLeaderboard.length === 0 && searchTerm ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400">
                    No users found matching &quot;{displayQuery}&quot;
                  </p>
                </div>
              ) : (
                filteredLeaderboard.map((user) => {
                  // Find the original rank in the full leaderboard
                  const originalIndex = initialLeaderboard.findIndex(
                    (u) => u.user_id === user.user_id,
                  );
                  const originalRank = originalIndex + 1;

                  const userData = userDataMap[user.user_id];
                  const userDisplay =
                    userData?.displayName ||
                    userData?.name ||
                    `User ${user.user_id}`;
                  const username = userData?.name || user.user_id;
                  const avatarUrl = avatarDataMap[user.user_id];

                  return (
                    <div
                      key={user.user_id}
                      className={`rounded-lg border p-3 transition-colors ${
                        originalRank === 1
                          ? "border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:bg-gradient-to-r hover:from-yellow-500/30 hover:to-yellow-600/30"
                          : originalRank === 2
                            ? "border-gray-300/50 bg-gradient-to-r from-gray-400/20 to-gray-500/20 hover:bg-gradient-to-r hover:from-gray-400/30 hover:to-gray-500/30"
                            : originalRank === 3
                              ? "border-amber-500/50 bg-gradient-to-r from-amber-600/20 to-amber-700/20 hover:bg-gradient-to-r hover:from-amber-600/30 hover:to-amber-700/30"
                              : "border-[#2E3944] bg-[#2E3944] hover:border-[#5865F2]"
                      }`}
                    >
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 ${
                              originalRank === 1
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800"
                                : originalRank === 2
                                  ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800"
                                  : originalRank === 3
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-gray-800"
                                    : "bg-[#2E3944] text-gray-300"
                            }`}
                          >
                            #{originalRank}
                          </div>
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={`${userDisplay} avatar`}
                              width={32}
                              height={32}
                              className="h-7 w-7 rounded-full sm:h-8 sm:w-8"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-[#2E3944] sm:h-8 sm:w-8" />
                          )}
                          <div className="flex min-w-0 flex-1 flex-col">
                            <a
                              href={`https://www.roblox.com/users/${user.user_id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-sm font-medium text-blue-300 transition-colors hover:text-blue-200 sm:text-base"
                            >
                              {userDisplay}
                            </a>
                            <a
                              href={`https://www.roblox.com/users/${user.user_id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-xs text-gray-400 transition-colors hover:text-blue-400 sm:text-sm"
                            >
                              @{username}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-x-2 sm:ml-2 sm:justify-start">
                          <span className="text-sm font-bold text-green-400 sm:text-lg">
                            ${formatMoney(user.money)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-8 text-center">
          <p className="text-gray-400">
            No money leaderboard data available at this time.
          </p>
        </div>
      )}
    </>
  );
}
