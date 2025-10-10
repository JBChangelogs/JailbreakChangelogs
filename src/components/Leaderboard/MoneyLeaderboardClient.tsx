"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";
import MoneyLeaderboardSearch from "./MoneyLeaderboardSearch";
import UserRankDisplay from "./UserRankDisplay";
import { DefaultAvatar } from "@/utils/avatar";
import { fetchLeaderboardUserData } from "@/app/leaderboard/actions";

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
  const [avatarErrorMap, setAvatarErrorMap] = useState<Record<string, boolean>>(
    {},
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Helper function to format money
  const formatMoney = (money: number) => {
    return new Intl.NumberFormat("en-US").format(money);
  };

  // Load user data and avatars for all users in batches of 10
  useEffect(() => {
    const loadUserData = async () => {
      if (initialLeaderboard.length === 0) return;

      try {
        const userIds = initialLeaderboard.map((user) => user.user_id);
        const BATCH_SIZE = 250;

        // Split userIds into batches of 250
        const batches = [];
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
          batches.push(userIds.slice(i, i + BATCH_SIZE));
        }

        // Process each batch sequentially using server action
        for (const batch of batches) {
          try {
            // Fetch batch user data and avatars via server action
            const result = await fetchLeaderboardUserData(batch);

            // Process user data
            if (result.userData && typeof result.userData === "object") {
              setUserDataMap((prev) => ({ ...prev, ...result.userData }));
            }

            // Process avatar data
            if (result.avatarData && typeof result.avatarData === "object") {
              setAvatarDataMap((prev) => ({ ...prev, ...result.avatarData }));
            }
          } catch (error) {
            console.error(
              `Failed to fetch batch for money leaderboard:`,
              error,
            );
          }
        }
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
            <h2 className="text-primary-text text-xl font-bold">
              Money Leaderboard ({filteredLeaderboard.length} players
              {searchTerm && ` of ${initialLeaderboard.length}`})
            </h2>
          </div>

          <MoneyLeaderboardSearch onSearch={handleSearch} />

          <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow mt-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
            <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
              {filteredLeaderboard.length === 0 && searchTerm ? (
                <div className="py-8 text-center">
                  <p className="text-secondary-text">
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
                        originalRank <= 3
                          ? ""
                          : "border-border-primary hover:border-border-focus bg-primary-bg"
                      }`}
                      style={{
                        ...(originalRank === 1 && {
                          background:
                            "linear-gradient(to right, hsl(45, 100%, 50%, 0.2), hsl(45, 100%, 45%, 0.2))",
                          borderColor: "hsl(45, 100%, 50%, 0.5)",
                        }),
                        ...(originalRank === 2 && {
                          background:
                            "linear-gradient(to right, hsl(0, 0%, 75%, 0.2), hsl(0, 0%, 65%, 0.2))",
                          borderColor: "hsl(0, 0%, 75%, 0.5)",
                        }),
                        ...(originalRank === 3 && {
                          background:
                            "linear-gradient(to right, hsl(30, 100%, 50%, 0.2), hsl(30, 100%, 45%, 0.2))",
                          borderColor: "hsl(30, 100%, 50%, 0.5)",
                        }),
                      }}
                    >
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 ${
                              originalRank <= 3
                                ? "text-black"
                                : "text-primary-text"
                            }`}
                            style={{
                              ...(originalRank === 1 && {
                                background:
                                  "linear-gradient(to right, hsl(45, 100%, 50%), hsl(45, 100%, 45%))",
                              }),
                              ...(originalRank === 2 && {
                                background:
                                  "linear-gradient(to right, hsl(0, 0%, 75%), hsl(0, 0%, 65%))",
                              }),
                              ...(originalRank === 3 && {
                                background:
                                  "linear-gradient(to right, hsl(30, 100%, 50%), hsl(30, 100%, 45%))",
                              }),
                            }}
                          >
                            #{originalRank}
                          </div>
                          {avatarUrl && !avatarErrorMap[user.user_id] ? (
                            <Image
                              src={avatarUrl}
                              alt={`${userDisplay} avatar`}
                              width={32}
                              height={32}
                              className="h-7 w-7 rounded-full bg-secondary-bg sm:h-8 sm:w-8"
                              onError={() => {
                                setAvatarErrorMap((prev) => ({
                                  ...prev,
                                  [user.user_id]: true,
                                }));
                              }}
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-secondary-bg sm:h-8 sm:w-8">
                              <DefaultAvatar />
                            </div>
                          )}
                          <div className="flex min-w-0 flex-1 flex-col">
                            <a
                              href={`https://www.roblox.com/users/${user.user_id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-text hover:text-link truncate text-sm font-medium transition-colors sm:text-base"
                            >
                              {userDisplay}
                            </a>
                            <a
                              href={`https://www.roblox.com/users/${user.user_id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-secondary-text hover:text-link truncate text-xs transition-colors sm:text-sm"
                            >
                              @{username}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-x-2 sm:ml-2 sm:justify-start">
                          <span className="text-button-success text-sm font-bold sm:text-lg">
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
        <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-8 text-center transition-colors duration-200 hover:shadow-lg">
          <p className="text-secondary-text">
            No money leaderboard data available at this time.
          </p>
        </div>
      )}
    </>
  );
}
