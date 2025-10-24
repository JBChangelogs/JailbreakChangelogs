"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardUserData } from "@/app/leaderboard/actions";
import CopyButton from "@/app/inventories/CopyButton";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DefaultAvatar } from "@/utils/avatar";

interface UserScan {
  user_id: string;
  upsert_count: number;
}

interface MostScannedLeaderboardClientProps {
  initialLeaderboard: UserScan[];
}

export default function MostScannedLeaderboardClient({
  initialLeaderboard,
}: MostScannedLeaderboardClientProps) {
  "use memo";
  const [searchTerm, setSearchTerm] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Extract user IDs from leaderboard data
  const userIds = initialLeaderboard.map((user) => user.user_id);

  // Use TanStack Query for fetching user data with caching
  const { data: fetchedUserData } = useQuery({
    queryKey: ["mostScannedUserData", userIds.sort()],
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
        user.user_id.includes(debouncedSearchTerm)
      );
    });
  })();

  // TanStack Virtual setup for performance with large datasets
  // Only renders visible items (~10-15 at a time) for 60FPS scrolling
  const virtualizer = useVirtualizer({
    count: filteredLeaderboard.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
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

  if (!initialLeaderboard || initialLeaderboard.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-primary-text mb-4 text-xl font-bold">
          Most Scanned Players
        </h2>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <svg
                  className="text-status-error h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              Leaderboard Unavailable
            </h3>
            <p className="text-secondary-text">
              Unable to load the leaderboard data. Please try refreshing the
              page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Most Scanned Players ({filteredLeaderboard.length}
        {searchTerm && ` of ${initialLeaderboard.length}`})
      </h2>

      {/* Search Input */}
      {initialLeaderboard.length > 10 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username or ID..."
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
      )}

      {/* Virtualized leaderboard container */}
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div
          ref={parentRef}
          className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-[32rem] overflow-y-auto pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border-primary) transparent",
          }}
        >
          {filteredLeaderboard.length === 0 && searchTerm ? (
            <div className="py-8 text-center">
              <p className="text-secondary-text">
                No users found matching &quot;{searchTerm}&quot;
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
                const index = virtualItem.index;

                const userData = userDataMap[user.user_id];
                const displayName =
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
                      className={`mb-3 flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center ${
                        index <= 2
                          ? ""
                          : "border-border-primary bg-primary-bg hover:border-border-focus"
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
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 ${
                            index <= 2 ? "text-black" : "text-primary-text"
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
                          #{index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="bg-tertiary-bg h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={`${displayName}'s avatar`}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallback =
                                    document.createElement("div");
                                  fallback.className =
                                    "flex h-full w-full items-center justify-center";
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <DefaultAvatar />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <a
                              href={`https://www.roblox.com/users/${user.user_id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-text hover:text-link-hover break-words font-medium transition-colors"
                            >
                              {displayName}
                            </a>
                            <div className="text-secondary-text break-words text-sm">
                              @{username} • {user.upsert_count.toLocaleString()}{" "}
                              scans
                            </div>
                          </div>
                          <CopyButton
                            text={user.user_id}
                            className="mt-1 flex-shrink-0"
                          />
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
  );
}
