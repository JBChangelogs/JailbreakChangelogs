import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";
import { Icon } from "@/components/ui/IconWrapper";
import type { LeaderboardEntry } from "@/components/Items/Suggestions/types";

interface SuggesterLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  loadingLeaderboard: boolean;
}

const podiumColors = ["hsl(45,100%,50%)", "hsl(0,0%,75%)", "hsl(30,100%,50%)"];

export function SuggesterLeaderboard({
  leaderboard,
  loadingLeaderboard,
}: SuggesterLeaderboardProps) {
  return (
    <>
      {(loadingLeaderboard || leaderboard.length > 0) && (
        <details className="border-border-card bg-secondary-bg group/leaderboard mb-4 rounded-lg border px-4 py-3">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 [&::-webkit-details-marker]:hidden">
            <span className="text-primary-text font-semibold">
              Suggestion Leaderboard
            </span>
            {!loadingLeaderboard && (
              <span className="hidden flex-wrap gap-2 sm:flex">
                {leaderboard.slice(0, 3).map((entry, index) => {
                  const displayName =
                    entry.user.roblox_display_name ||
                    entry.user.roblox_username ||
                    "Unknown";
                  return (
                    <span
                      key={entry.user.id}
                      className="border-border-card bg-tertiary-bg inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm"
                    >
                      <span
                        className="font-bold"
                        style={{ color: podiumColors[index] }}
                      >
                        #{index + 1}
                      </span>
                      <UserAvatar
                        userId={entry.user.id}
                        avatarHash={entry.user.avatar ?? null}
                        username={displayName}
                        forceAvatarUrl={entry.user.roblox_avatar}
                        size={8}
                        cdnSize={64}
                        custom_avatar={entry.user.custom_avatar ?? undefined}
                        showBadge={false}
                        premiumType={entry.user.premiumtype}
                        bgClassName="bg-quaternary-bg"
                      />
                      <span className="text-primary-text max-w-28 truncate font-medium">
                        {displayName}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: podiumColors[index] }}
                      >
                        {entry.acceptance_rate.toFixed(1)}%
                      </span>
                    </span>
                  );
                })}
                {leaderboard.length > 3 && (
                  <span className="text-secondary-text self-center text-sm group-open/leaderboard:hidden">
                    +{leaderboard.length - 3}{" "}
                    {leaderboard.length === 4 ? "other" : "others"}
                  </span>
                )}
              </span>
            )}
            <span className="text-link ml-auto inline-flex items-center gap-1 text-sm font-medium">
              <span className="group-open/leaderboard:hidden">View all</span>
              <span className="hidden group-open/leaderboard:inline">
                Show less
              </span>
              <Icon
                icon="heroicons:chevron-down"
                className="h-4 w-4 transition-transform group-open/leaderboard:rotate-180"
                inline
              />
            </span>
          </summary>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {loadingLeaderboard
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-border-card bg-tertiary-bg flex w-52 shrink-0 animate-pulse flex-col items-center gap-2 rounded-xl border p-4"
                  >
                    <div className="bg-quaternary-bg h-3 w-6 rounded" />
                    <div className="bg-quaternary-bg h-12 w-12 rounded-full" />
                    <div className="bg-quaternary-bg h-3 w-20 rounded" />
                    <div className="bg-quaternary-bg h-6 w-16 rounded" />
                    <div className="bg-quaternary-bg h-3 w-full rounded" />
                    <div className="bg-quaternary-bg h-3 w-full rounded" />
                  </div>
                ))
              : leaderboard.map((entry, i) => {
                  const displayName =
                    entry.user.roblox_display_name ||
                    entry.user.roblox_username ||
                    "Unknown";
                  const rate =
                    entry.acceptance_rate % 1 === 0
                      ? String(entry.acceptance_rate)
                      : entry.acceptance_rate.toFixed(1);
                  const accentColor =
                    i === 0
                      ? "hsl(45,100%,50%)"
                      : i === 1
                        ? "hsl(0,0%,75%)"
                        : i === 2
                          ? "hsl(30,100%,50%)"
                          : undefined;
                  return (
                    <Link
                      key={entry.user.id}
                      href={`/users/${entry.user.id}`}
                      prefetch={false}
                      className="border-border-card bg-tertiary-bg group/card flex w-52 shrink-0 flex-col items-center gap-3 rounded-xl border p-4"
                      style={
                        accentColor ? { borderColor: accentColor } : undefined
                      }
                    >
                      {/* Rank */}
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: accentColor ?? "var(--color-secondary-text)",
                        }}
                      >
                        #{i + 1}
                      </span>

                      {/* Avatar */}
                      <UserAvatar
                        userId={entry.user.id!}
                        avatarHash={entry.user.avatar ?? null}
                        username={displayName}
                        forceAvatarUrl={entry.user.roblox_avatar}
                        size={14}
                        cdnSize={256}
                        custom_avatar={entry.user.custom_avatar ?? undefined}
                        showBadge={false}
                        premiumType={entry.user.premiumtype}
                        bgClassName="bg-quaternary-bg"
                      />

                      {/* Name + supporter */}
                      <div className="flex w-full items-center justify-center gap-1">
                        <span className="text-primary-text group-hover/card:text-link truncate text-sm font-semibold transition-colors">
                          {displayName}
                        </span>
                        {entry.user.premiumtype !== undefined &&
                          entry.user.premiumtype >= 1 &&
                          entry.user.premiumtype <= 3 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Image
                                  src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${entry.user.premiumtype}.svg`}
                                  alt={`Supporter Type ${entry.user.premiumtype}`}
                                  width={12}
                                  height={12}
                                  className="shrink-0 cursor-pointer"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                Supporter Type {entry.user.premiumtype}
                              </TooltipContent>
                            </Tooltip>
                          )}
                      </div>

                      {/* Acceptance rate hero */}
                      <div className="text-center">
                        <p
                          className="text-lg leading-none font-bold"
                          style={{
                            color: accentColor ?? "var(--color-primary-text)",
                          }}
                        >
                          {rate}%
                        </p>
                        <p className="text-secondary-text mt-0.5 text-xs">
                          acceptance
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="border-border-card w-full space-y-1 border-t pt-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-secondary-text">Accepted</span>
                          <span className="text-primary-text font-medium">
                            {entry.total_accepted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-secondary-text">Submitted</span>
                          <span className="text-primary-text font-medium">
                            {entry.total_submitted}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </details>
      )}
    </>
  );
}
