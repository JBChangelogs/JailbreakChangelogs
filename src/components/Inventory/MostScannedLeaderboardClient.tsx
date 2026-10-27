"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardUserData } from "@/app/leaderboard/actions";
import { Icon } from "@/components/ui/IconWrapper";
import { DefaultAvatar } from "@/utils/ui/avatar";

interface UserScan {
  user_id: string;
  upsert_count: number;
}

function LeaderboardAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string;
  displayName: string;
}) {
  const [avatarError, setAvatarError] = useState(false);
  if (avatarError) {
    return <DefaultAvatar name={displayName} />;
  }
  return (
    <Image
      placeholder={IMAGE_PLACEHOLDER}
      src={avatarUrl}
      alt={`${displayName}'s avatar`}
      width={40}
      height={40}
      className="h-full w-full object-cover"
      onError={() => setAvatarError(true)}
    />
  );
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
  const columnCount = useMediaQuery("(min-width: 1280px)") ? 2 : 1;
  const leaderboardRanks = new Map(
    initialLeaderboard.map((user, index) => [user.user_id, index + 1]),
  );

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

      for (const batch of batches) {
        const result = await fetchLeaderboardUserData(batch);
        if (result.userData && typeof result.userData === "object") {
          allUserData = { ...allUserData, ...result.userData };
        }
      }

      return { userData: allUserData };
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

  // Generate avatar URL directly
  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

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

  // Virtualize rows so ranks read left to right on wide screens.
  const virtualizer = useVirtualizer({
    count: Math.ceil(filteredLeaderboard.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Recalculate heights on window resize for responsive behavior
  useEffect(() => {
    virtualizer.measure();
    const handleResize = () => {
      virtualizer.measure();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [columnCount, virtualizer]);

  if (!initialLeaderboard || initialLeaderboard.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-primary-text mb-4 text-xl font-bold">
          Most Scanned Players
        </h2>
        <div className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
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
    <div className="border-border-card bg-secondary-bg mt-8 overflow-hidden rounded-xl border">
      <h2 className="text-primary-text border-border-card mb-4 border-b px-4 py-5 text-lg font-semibold sm:px-6">
        Most scanned players ({filteredLeaderboard.length}
        {searchTerm && <span>{` of ${initialLeaderboard.length}`}</span>})
      </h2>

      {/* Search Input */}
      {initialLeaderboard.length > 10 && (
        <div className="mb-4 px-4 sm:px-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username or ID..."
              aria-label="Search players by username or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
            />
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Virtualized leaderboard container */}
      <div
        ref={parentRef}
        role="region"
        aria-label="Most scanned players ranked list"
        tabIndex={0}
        className="scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus focus-visible:outline-border-focus max-h-128 scrollbar-thin scrollbar-track-transparent overflow-y-auto overscroll-contain px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 sm:px-6"
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
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 grid w-full gap-x-8 xl:grid-cols-2"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {filteredLeaderboard
                  .slice(
                    virtualRow.index * columnCount,
                    (virtualRow.index + 1) * columnCount,
                  )
                  .map((user) => {
                    const rank = leaderboardRanks.get(user.user_id)!;
                    const userData = userDataMap[user.user_id];
                    const displayName =
                      userData?.displayName ||
                      userData?.name ||
                      `User ${user.user_id}`;
                    const username = userData?.name || user.user_id;

                    return (
                      <div
                        key={user.user_id}
                        className="border-border-card min-w-0 border-b"
                      >
                        <Link
                          href={`/inventories/${user.user_id}`}
                          prefetch={false}
                          aria-label={`View ${username}'s inventory`}
                          className="group hover:bg-tertiary-bg focus-visible:outline-border-focus -mx-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-3 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:gap-4"
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                              rank === 1
                                ? "bg-amber-400/15 text-amber-400"
                                : rank === 2
                                  ? "bg-slate-300/15 text-slate-300"
                                  : rank === 3
                                    ? "bg-orange-400/15 text-orange-400"
                                    : "text-secondary-text"
                            }`}
                          >
                            <span className="sr-only">Rank </span>
                            {rank}
                          </span>
                          <div className="bg-quaternary-bg h-10 w-10 shrink-0 overflow-hidden rounded-full">
                            <LeaderboardAvatar
                              avatarUrl={getUserAvatar(user.user_id)}
                              displayName={displayName}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-primary-text group-hover:text-link block text-sm font-semibold wrap-break-word transition-colors">
                              {displayName}
                            </span>
                            <span className="text-secondary-text block text-xs wrap-break-word">
                              @{username}
                            </span>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-primary-text block text-base font-semibold tabular-nums">
                              {user.upsert_count.toLocaleString()}
                            </span>
                            <span className="text-secondary-text text-xs">
                              scans
                            </span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
