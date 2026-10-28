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

const podiumClasses = [
  "bg-amber-400/15 text-amber-400",
  "bg-slate-300/15 text-slate-300",
  "bg-orange-400/15 text-orange-400",
];

export function SuggesterLeaderboard({
  leaderboard,
  loadingLeaderboard,
}: SuggesterLeaderboardProps) {
  return (
    <>
      {(loadingLeaderboard || leaderboard.length > 0) && (
        <details className="border-border-card bg-secondary-bg group/leaderboard mb-4 overflow-hidden rounded-xl border">
          <summary className="border-border-card flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 group-open/leaderboard:border-b sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="text-primary-text inline-flex min-h-[42px] items-center text-lg font-semibold">
              Suggestion leaderboard
            </span>
            {!loadingLeaderboard && (
              <span className="hidden flex-wrap gap-2 group-open/leaderboard:hidden sm:flex">
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
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${podiumClasses[index]}`}
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
                      <span className="text-primary-text font-semibold tabular-nums">
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
          <div
            role="region"
            aria-label="Suggestion leaderboard ranked list"
            tabIndex={0}
            className="focus-visible:outline-border-focus max-h-128 overflow-y-auto overscroll-contain px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 sm:px-6"
          >
            <ol className="grid gap-x-8 xl:grid-cols-2">
              {loadingLeaderboard
                ? Array.from({ length: 5 }).map((_, i) => (
                    <li
                      key={i}
                      aria-hidden="true"
                      className="border-border-card flex animate-pulse items-center gap-3 border-b py-3"
                    >
                      <div className="bg-quaternary-bg/70 h-7 w-7 shrink-0 rounded-full" />
                      <div className="bg-quaternary-bg/70 h-10 w-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="bg-quaternary-bg/70 h-4 w-24 max-w-full rounded" />
                        <div className="bg-quaternary-bg/70 h-3 w-40 max-w-full rounded" />
                      </div>
                      <div className="bg-tertiary-bg h-6 w-14 shrink-0 rounded" />
                    </li>
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
                    return (
                      <li
                        key={entry.user.id}
                        className="border-border-card min-w-0 border-b py-1"
                      >
                        <Link
                          href={`/users/${entry.user.id}`}
                          prefetch={false}
                          className="group/card hover:bg-tertiary-bg focus-visible:outline-border-focus -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:gap-4"
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${podiumClasses[i] ?? "text-secondary-text"}`}
                          >
                            <span className="sr-only">Rank </span>
                            {i + 1}
                          </span>

                          <UserAvatar
                            userId={entry.user.id!}
                            avatarHash={entry.user.avatar ?? null}
                            username={displayName}
                            forceAvatarUrl={entry.user.roblox_avatar}
                            size={10}
                            cdnSize={128}
                            custom_avatar={
                              entry.user.custom_avatar ?? undefined
                            }
                            showBadge={false}
                            premiumType={entry.user.premiumtype}
                            bgClassName="bg-quaternary-bg"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-primary-text group-hover/card:text-link min-w-0 text-sm font-semibold wrap-break-word transition-colors">
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

                            <p className="text-secondary-text mt-1 text-xs">
                              <span className="font-medium tabular-nums">
                                {entry.total_accepted.toLocaleString()}
                              </span>{" "}
                              accepted
                              <span aria-hidden="true"> / </span>
                              <span className="font-medium tabular-nums">
                                {entry.total_submitted.toLocaleString()}
                              </span>{" "}
                              submitted
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-primary-text text-base font-semibold tabular-nums">
                              {rate}%
                            </p>
                            <p className="text-secondary-text text-xs">
                              acceptance
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
            </ol>
          </div>
        </details>
      )}
    </>
  );
}
