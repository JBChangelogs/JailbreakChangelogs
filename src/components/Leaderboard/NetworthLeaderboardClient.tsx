"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import NetworthLeaderboardSearch from "./NetworthLeaderboardSearch";
import UserNetworthDisplay from "./UserNetworthDisplay";
import { DefaultAvatar } from "@/utils/avatar";
import { fetchLeaderboardUserData } from "@/app/leaderboard/actions";
import { getCategoryColor } from "@/utils/categoryIcons";

interface NetworthLeaderboardEntry {
  user_id: string;
  networth: number;
  inventory_count: number;
  money?: number;
  inventory_value?: number;
  percentages?: Record<string, number>;
}

interface NetworthLeaderboardClientProps {
  initialLeaderboard: NetworthLeaderboardEntry[];
}

export default function NetworthLeaderboardClient({
  initialLeaderboard,
}: NetworthLeaderboardClientProps) {
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Helper function to format networth
  const formatNetworth = (networth: number) => {
    return new Intl.NumberFormat("en-US").format(networth);
  };

  // Helper function to format inventory count
  const formatInventoryCount = (count: number) => {
    return new Intl.NumberFormat("en-US").format(count);
  };

  // Load user data and avatars for all users in batches of 10
  useEffect(() => {
    const loadUserData = async () => {
      if (initialLeaderboard.length === 0) return;

      try {
        const userIds = initialLeaderboard.map((user) => user.user_id);
        const BATCH_SIZE = 50;

        // Split userIds into batches of 50
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
              `Failed to fetch batch for networth leaderboard:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to fetch user data for networth leaderboard:",
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

  const toggleRowExpanded = (userId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Truncate very long queries for display purposes
  const MAX_QUERY_DISPLAY_LENGTH = 120;
  const displayQuery =
    searchTerm.length > MAX_QUERY_DISPLAY_LENGTH
      ? `${searchTerm.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
      : searchTerm;

  return (
    <>
      <UserNetworthDisplay />

      {initialLeaderboard && initialLeaderboard.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-primary-text text-xl font-bold">
              Networth Leaderboard ({filteredLeaderboard.length} players
              {searchTerm && ` of ${initialLeaderboard.length}`})
            </h2>
          </div>

          <NetworthLeaderboardSearch onSearch={handleSearch} />

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
                  const isExpanded = expandedRows.has(user.user_id);
                  const hasPercentages =
                    user.percentages &&
                    Object.keys(user.percentages).length > 0;

                  return (
                    <div
                      key={user.user_id}
                      className={`rounded-lg border p-3 transition-all duration-200 ${
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
                            <Link
                              href={`/inventories/${user.user_id}`}
                              prefetch={false}
                              className="text-primary-text hover:text-link truncate text-sm font-medium transition-colors sm:text-base cursor-pointer"
                            >
                              {userDisplay}
                            </Link>
                            <Link
                              href={`/inventories/${user.user_id}`}
                              prefetch={false}
                              className="text-secondary-text hover:text-link truncate text-xs transition-colors sm:text-sm cursor-pointer"
                            >
                              @{username}
                            </Link>
                            {hasPercentages && (
                              <button
                                onClick={() => toggleRowExpanded(user.user_id)}
                                className="text-secondary-text hover:text-primary-text transition-colors text-xs flex items-center gap-1 bg-secondary-bg hover:bg-border-primary px-2 py-1 rounded-md border border-border-primary hover:border-border-focus w-fit mt-1 cursor-pointer"
                                aria-label={
                                  isExpanded
                                    ? "Collapse inventory breakdown"
                                    : "View inventory breakdown"
                                }
                              >
                                <span className="text-xs font-medium">
                                  {isExpanded ? "Hide" : "View"} Breakdown
                                </span>
                                <svg
                                  className={`w-3 h-3 transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 sm:ml-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                          <div className="text-right">
                            <span className="text-button-success text-sm font-bold sm:text-lg">
                              ${formatNetworth(user.networth)}
                            </span>
                            <div className="text-secondary-text text-xs">
                              {formatInventoryCount(user.inventory_count)} items
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Section */}
                      {hasPercentages && isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border-primary animate-in fade-in duration-200">
                          <h4 className="text-primary-text text-sm font-semibold mb-2">
                            Inventory Breakdown
                          </h4>

                          {/* Stacked Bar Chart */}
                          <div className="mb-3 h-8 w-full overflow-hidden rounded-md bg-secondary-bg flex">
                            {Object.entries(user.percentages!)
                              .sort(([, a], [, b]) => b - a)
                              .map(([category, percentage]) => (
                                <div
                                  key={category}
                                  className="relative group"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: getCategoryColor(category),
                                  }}
                                  title={`${category}: ${percentage.toFixed(2)}%`}
                                >
                                  {percentage > 5 && (
                                    <span className="absolute inset-0 hidden sm:flex items-center justify-center text-xs font-medium text-white drop-shadow">
                                      {percentage.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* Category List */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {Object.entries(user.percentages!)
                              .sort(([, a], [, b]) => b - a)
                              .map(([category, percentage]) => (
                                <div
                                  key={category}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <div
                                    className="w-3 h-3 rounded-sm flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        getCategoryColor(category),
                                    }}
                                  />
                                  <span className="text-primary-text truncate">
                                    {category}
                                  </span>
                                  <span className="text-secondary-text ml-auto">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
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
            No networth leaderboard data available at this time.
          </p>
        </div>
      )}
    </>
  );
}
