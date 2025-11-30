"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import NetworthLeaderboardSearch from "./NetworthLeaderboardSearch";
import UserNetworthDisplay from "./UserNetworthDisplay";
import InventoryBreakdownModal from "../Modals/InventoryBreakdownModal";
import { DefaultAvatar } from "@/utils/avatar";
import { fetchLeaderboardUserData } from "@/app/leaderboard/actions";

interface NetworthLeaderboardEntry {
  user_id: string;
  networth: number;
  inventory_count: number;
  money?: number;
  inventory_value?: number;
  percentages?: Record<string, number>;
  duplicates_count?: number;
  duplicates_value?: number | null;
  duplicates_percentages?: Record<string, number> | null;
}

interface NetworthLeaderboardClientProps {
  initialLeaderboard: NetworthLeaderboardEntry[];
}

export default function NetworthLeaderboardClient({
  initialLeaderboard,
}: NetworthLeaderboardClientProps) {
  "use memo";
  const [searchTerm, setSearchTerm] = useState("");
  const [avatarErrorMap, setAvatarErrorMap] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedUser, setSelectedUser] =
    useState<NetworthLeaderboardEntry | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Extract user IDs from leaderboard data
  const userIds = initialLeaderboard.map((user) => user.user_id);

  // Use TanStack Query for fetching user data with caching
  // Shared cache key across all leaderboards for user data reuse
  const { data: fetchedUserData } = useQuery({
    queryKey: ["leaderboardUserData", userIds.sort()],
    queryFn: async () => {
      // Fetch in batches of 500
      const BATCH_SIZE = 500;
      const batches = [];
      for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        batches.push(userIds.slice(i, i + BATCH_SIZE));
      }

      let allUserData: Record<string, unknown> = {};
      let allAvatarData: Record<string, string> = {};

      for (const batch of batches) {
        const result = await fetchLeaderboardUserData(batch);
        if (result.userData && typeof result.userData === "object") {
          allUserData = { ...allUserData, ...result.userData };
        }
        if (result.avatarData && typeof result.avatarData === "object") {
          allAvatarData = { ...allAvatarData, ...result.avatarData };
        }
      }

      return { userData: allUserData, avatarData: allAvatarData };
    },
    enabled: userIds.length > 0,
  });

  // Transform data during render - React compiler handles memoization
  const userDataMap: Record<string, { displayName?: string; name?: string }> =
    (() => {
      if (
        fetchedUserData &&
        "userData" in fetchedUserData &&
        typeof fetchedUserData.userData === "object"
      ) {
        return fetchedUserData.userData as Record<
          string,
          { displayName?: string; name?: string }
        >;
      }
      return {};
    })();

  const avatarDataMap: Record<string, string> = (() => {
    if (
      fetchedUserData &&
      "avatarData" in fetchedUserData &&
      typeof fetchedUserData.avatarData === "object"
    ) {
      return fetchedUserData.avatarData as Record<string, string>;
    }
    return {};
  })();

  // Filter leaderboard based on debounced search term
  const filteredLeaderboard = (() => {
    if (!debouncedSearchTerm.trim()) {
      return initialLeaderboard;
    }

    return initialLeaderboard.filter((user) => {
      const userData = userDataMap[user.user_id];
      const userDisplay =
        userData?.displayName || userData?.name || `User ${user.user_id}`;
      const username = userData?.name || user.user_id;

      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        userDisplay.toLowerCase().includes(searchLower) ||
        username.toLowerCase().includes(searchLower) ||
        user.user_id.toLowerCase().includes(searchLower)
      );
    });
  })();

  // TanStack Virtual setup for performance with large datasets
  // Only renders visible items (~10-15 at a time) for 60FPS scrolling
  const virtualizer = useVirtualizer({
    count: filteredLeaderboard.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Simple estimate - let TanStack measure actual content
    overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
  });

  // Recalculate heights on window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      virtualizer.measure();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle opening breakdown modal
  const handleOpenBreakdown = (user: NetworthLeaderboardEntry) => {
    setSelectedUser(user);
    setIsBreakdownModalOpen(true);
  };

  // Handle closing breakdown modal
  const handleCloseBreakdown = () => {
    setIsBreakdownModalOpen(false);
    setSelectedUser(null);
  };

  // Format large numbers with commas for better readability
  const formatNetworth = (networth: number) => {
    return new Intl.NumberFormat("en-US").format(networth);
  };

  const formatInventoryCount = (count: number) => {
    return new Intl.NumberFormat("en-US").format(count);
  };

  // Truncate long search queries for display purposes
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

          {/* Virtualized leaderboard container with fixed height for performance */}
          <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow mt-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
            <div
              ref={parentRef}
              className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus h-[48rem] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "var(--color-border-primary) transparent",
              }}
            >
              {filteredLeaderboard.length === 0 && searchTerm ? (
                <div className="py-8 text-center">
                  <p className="text-secondary-text">
                    No users found matching &quot;{displayQuery}&quot;
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const user = filteredLeaderboard[virtualItem.index];
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
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div
                          className={`mb-4 cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-lg ${
                            originalRank <= 3
                              ? ""
                              : "border-border-primary hover:border-border-focus bg-primary-bg"
                          }`}
                          onClick={() => handleOpenBreakdown(user)}
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
                                  className="bg-tertiary-bg h-7 w-7 rounded-full sm:h-8 sm:w-8"
                                  onError={() => {
                                    setAvatarErrorMap((prev) => ({
                                      ...prev,
                                      [user.user_id]: true,
                                    }));
                                  }}
                                />
                              ) : (
                                <div className="bg-tertiary-bg h-7 w-7 rounded-full sm:h-8 sm:w-8">
                                  <DefaultAvatar />
                                </div>
                              )}
                              <div className="flex min-w-0 flex-1 flex-col">
                                <Link
                                  href={`/inventories/${user.user_id}`}
                                  prefetch={false}
                                  className="text-primary-text hover:text-link cursor-pointer truncate text-sm font-medium transition-colors sm:text-base"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {userDisplay}
                                </Link>
                                <Link
                                  href={`/inventories/${user.user_id}`}
                                  prefetch={false}
                                  className="text-secondary-text hover:text-link cursor-pointer truncate text-xs transition-colors sm:text-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  @{username}
                                </Link>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2 sm:ml-2 sm:justify-start">
                              <div className="text-center sm:text-right">
                                <span className="text-button-success text-sm font-bold sm:text-lg">
                                  ${formatNetworth(user.networth)}
                                </span>
                                <div className="text-secondary-text text-xs">
                                  {formatInventoryCount(user.inventory_count)}{" "}
                                  items
                                </div>
                                <div className="mt-1 flex justify-center sm:justify-end">
                                  <div className="text-form-button-text bg-button-info hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none">
                                    Click to view breakdown
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

      {/* Inventory Breakdown Modal */}
      {selectedUser && (
        <InventoryBreakdownModal
          isOpen={isBreakdownModalOpen}
          onClose={handleCloseBreakdown}
          username={
            userDataMap[selectedUser.user_id]?.name || selectedUser.user_id
          }
          networth={selectedUser.networth}
          inventoryCount={selectedUser.inventory_count}
          percentages={selectedUser.percentages || {}}
          money={selectedUser.money}
          inventoryValue={selectedUser.inventory_value}
          duplicatesCount={selectedUser.duplicates_count}
          duplicatesValue={selectedUser.duplicates_value}
          duplicatesPercentages={selectedUser.duplicates_percentages}
        />
      )}
    </>
  );
}
