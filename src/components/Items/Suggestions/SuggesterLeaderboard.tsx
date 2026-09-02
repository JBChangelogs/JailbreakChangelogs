import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";
import type { LeaderboardEntry } from "@/components/Items/Suggestions/types";

interface SuggesterLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  loadingLeaderboard: boolean;
}

export function SuggesterLeaderboard({
  leaderboard,
  loadingLeaderboard,
}: SuggesterLeaderboardProps) {
  return (
    <>
      {/* Top Suggesters Leaderboard */}
      {(loadingLeaderboard || leaderboard.length > 0) && (
        <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-primary-text text-lg font-semibold">
              Top Suggesters
              {!loadingLeaderboard && leaderboard.length > 0 && (
                <span className="text-secondary-text ml-1 font-normal">
                  ({leaderboard.length})
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
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
                      className="border-border-card bg-tertiary-bg group flex w-52 shrink-0 flex-col items-center gap-3 rounded-xl border p-4"
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
                        <span className="text-primary-text group-hover:text-link truncate text-sm font-semibold transition-colors">
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
        </div>
      )}
    </>
  );
}
