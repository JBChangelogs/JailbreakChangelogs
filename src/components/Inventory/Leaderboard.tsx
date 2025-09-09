"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  fetchMissingRobloxData,
  fetchOriginalOwnerAvatars,
} from "@/app/inventories/actions";
import CopyButton from "@/app/inventories/CopyButton";

interface LeaderboardUser {
  user_id: string;
  upsert_count: number;
}

interface RobloxUser {
  displayName?: string;
  name?: string;
}

interface LeaderboardProps {
  leaderboard: LeaderboardUser[];
}

export default function Leaderboard({ leaderboard }: LeaderboardProps) {
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState<Record<string, string>>(
    {},
  );
  const [visibleUsers, setVisibleUsers] = useState<LeaderboardUser[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const USERS_PER_BATCH = 20; // Load 20 users at a time

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

  // Fetch avatars for users
  const fetchUserAvatars = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter((id) => !robloxAvatars[id]);

      if (missingIds.length === 0) return;

      try {
        const avatarData = await fetchOriginalOwnerAvatars(missingIds);

        // Update state with new avatar data
        if (avatarData && typeof avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch user avatars:", error);
      }
    },
    [robloxAvatars],
  );

  // Load initial batch of users
  useEffect(() => {
    const initialBatch = leaderboard.slice(0, USERS_PER_BATCH);
    setVisibleUsers(initialBatch);
  }, [leaderboard]);

  // Progressive loading for visible users
  useEffect(() => {
    if (visibleUsers.length === 0) return;

    const userIdsToLoad = visibleUsers.map((user) => user.user_id);

    // Fetch user data and avatars for visible users
    fetchMissingUserData(userIdsToLoad);
    fetchUserAvatars(userIdsToLoad);
  }, [visibleUsers, fetchMissingUserData, fetchUserAvatars]);

  // Load more users
  const loadMoreUsers = useCallback(() => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);

    // Simulate loading delay
    setTimeout(() => {
      const currentCount = visibleUsers.length;
      const nextBatch = leaderboard.slice(
        currentCount,
        currentCount + USERS_PER_BATCH,
      );

      if (nextBatch.length > 0) {
        setVisibleUsers((prev) => [...prev, ...nextBatch]);
      }

      setIsLoadingMore(false);
    }, 300);
  }, [visibleUsers.length, leaderboard, isLoadingMore]);

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

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-gray-300">
        Most Scanned Players
      </h2>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
          {visibleUsers.map((user, index) => {
            const displayName = getUserDisplay(user.user_id);
            const username = getUsername(user.user_id);
            const avatarUrl = getUserAvatar(user.user_id);

            return (
              <div
                key={user.user_id}
                className="flex flex-col gap-3 rounded-lg border border-[#37424D] bg-[#2E3944] p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-black"
                        : index === 1
                          ? "bg-gray-400 text-black"
                          : index === 2
                            ? "bg-amber-600 text-white"
                            : "bg-[#37424D] text-gray-300"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#37424D]">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${displayName}'s avatar`}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5865F2]">
                          <span className="text-xs font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
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
                        className="font-medium break-words text-blue-400 transition-colors hover:text-blue-300"
                      >
                        {displayName}
                      </a>
                      <div className="text-sm break-words text-gray-400">
                        @{username} • {user.upsert_count.toLocaleString()} scans
                      </div>
                    </div>
                    <CopyButton
                      text={user.user_id}
                      className="mt-1 flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {visibleUsers.length < leaderboard.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMoreUsers}
                disabled={isLoadingMore}
                className="flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-white transition-colors hover:bg-[#4752C4] disabled:bg-[#37424D]"
              >
                {isLoadingMore ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More ({visibleUsers.length} of {leaderboard.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
