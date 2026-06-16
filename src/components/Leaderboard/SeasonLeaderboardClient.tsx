"use client";

import { useState } from "react";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { Season } from "@/types/seasons";
import XpProgressBar from "@/components/Inventory/XpProgressBar";
import { bangers } from "@/app/fonts";

interface SeasonLeaderboardEntry {
  id: number;
  total_exp: number;
  name: string;
  lvl: number;
  exp: number;
}

interface SeasonLeaderboardClientProps {
  initialLeaderboard: SeasonLeaderboardEntry[];
  updatedAt?: number;
  season: Season | null;
}

export default function SeasonLeaderboardClient({
  initialLeaderboard,
  updatedAt,
  season,
}: SeasonLeaderboardClientProps) {
  "use memo";
  const [searchTerm, setSearchTerm] = useState("");
  const [avatarErrorMap, setAvatarErrorMap] = useState<Record<number, boolean>>(
    {},
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const getUserAvatar = (userId: number) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  const filteredLeaderboard = (() => {
    if (!debouncedSearchTerm.trim()) {
      return initialLeaderboard;
    }

    return initialLeaderboard.filter((user) => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.id.toString().includes(debouncedSearchTerm)
      );
    });
  })();

  const MAX_QUERY_DISPLAY_LENGTH = 120;
  const displayQuery =
    searchTerm.length > MAX_QUERY_DISPLAY_LENGTH
      ? `${searchTerm.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
      : searchTerm;

  return (
    <>
      {initialLeaderboard && initialLeaderboard.length > 0 ? (
        <div>
          {/* Search Input */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search players by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
            />
            <svg
              className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Leaderboard entries */}
          {filteredLeaderboard.length === 0 && searchTerm ? (
            <div className="py-8 text-center">
              <p className="text-secondary-text">
                No users found matching &quot;{displayQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaderboard.map((user) => {
                const originalIndex = initialLeaderboard.findIndex(
                  (u) => u.id === user.id,
                );
                const originalRank = originalIndex + 1;
                const avatarUrl = getUserAvatar(user.id);

                return (
                  <div
                    key={user.id}
                    className={`rounded-lg border p-3 ${
                      originalRank <= 3
                        ? ""
                        : "border-border-card bg-tertiary-bg"
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
                    <div className="flex flex-col space-y-2">
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
                        {avatarUrl && !avatarErrorMap[user.id] ? (
                          <Image
                            src={avatarUrl}
                            alt={`${user.name} avatar`}
                            width={40}
                            height={40}
                            className="bg-quaternary-bg h-8 w-8 rounded-full sm:h-10 sm:w-10"
                            onError={() => {
                              setAvatarErrorMap((prev) => ({
                                ...prev,
                                [user.id]: true,
                              }));
                            }}
                          />
                        ) : (
                          <div className="bg-quaternary-bg h-8 w-8 rounded-full sm:h-10 sm:w-10">
                            <DefaultAvatar />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate">
                            <a
                              href={`https://www.roblox.com/users/${user.id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${bangers.className} text-primary-text hover:text-link text-xl tracking-wide transition-colors sm:text-2xl`}
                            >
                              {user.name}
                            </a>
                          </span>
                        </div>
                      </div>
                      <div className="w-full">
                        <XpProgressBar
                          currentLevel={user.lvl}
                          currentXp={user.exp}
                          season={season}
                          bgStyle="quaternary"
                          mobileSecondaryTextMode="xp"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Last Updated */}
          {updatedAt && updatedAt > 0 && (
            <p className="text-secondary-text mt-4 text-right text-sm">
              <span className="font-semibold">Last Updated:</span>{" "}
              {formatMessageDate(updatedAt)}
            </p>
          )}
        </div>
      ) : (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <p className="text-secondary-text">
            No season leaderboard data available at this time.
          </p>
        </div>
      )}
    </>
  );
}
