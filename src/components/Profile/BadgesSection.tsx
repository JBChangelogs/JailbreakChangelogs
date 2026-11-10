"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import { cn } from "@/lib/utils";
import ProfileTabError from "./ProfileTabError";

interface BadgeProgress {
  id: string;
  category: string;
  name: string;
  description: string;
  earned: boolean;
  earned_at: number | null;
  number: number | null;
  holders: number;
  current: number;
  target: number | null;
}

const formatNumber = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 1 });

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const BADGE_ICONS = [
  { prefix: "networth_", icon: "heroicons:chart-bar" },
  { prefix: "cash_", icon: "heroicons:banknotes" },
  { prefix: "on_the_grind", icon: "heroicons:bolt" },
  { prefix: "money_to_spare", icon: "heroicons:banknotes" },
  { prefix: "offshore_grinding", icon: "heroicons:globe-alt" },
  { prefix: "no_life", icon: "heroicons:fire" },
  { prefix: "collector_seasons_", icon: "heroicons:calendar-days" },
  { prefix: "collector_all", icon: "heroicons:trophy" },
  { prefix: "limited_", icon: "heroicons:sparkles" },
  { prefix: "true_dedication", icon: "heroicons:heart" },
  { prefix: "dealer", icon: "heroicons:currency-dollar" },
  { prefix: "businessman", icon: "heroicons:briefcase" },
  { prefix: "art_of_the_deal", icon: "heroicons:document-check" },
  { prefix: "con_artist", icon: "heroicons:face-smile" },
  { prefix: "verified", icon: "heroicons:check-badge" },
  { prefix: "theme_winner", icon: "heroicons:paint-brush" },
  { prefix: "veteran", icon: "heroicons:clock" },
  { prefix: "trade_ads_", icon: "heroicons:arrows-right-left" },
  { prefix: "group_member", icon: "heroicons:user-group" },
  { prefix: "testimonial", icon: "heroicons:chat-bubble-left-right" },
  { prefix: "server_benefactor", icon: "heroicons:server-stack" },
  { prefix: "designer", icon: "mdi:palette-outline" },
  { prefix: "power_user", icon: "heroicons:computer-desktop" },
  { prefix: "economist", icon: "heroicons:scale" },
  { prefix: "market_expert", icon: "heroicons:presentation-chart-line" },
  { prefix: "gifter", icon: "heroicons:gift" },
  { prefix: "local_celebrity", icon: "heroicons:megaphone" },
  { prefix: "unanimous", icon: "heroicons:hand-thumb-up" },
];
const CATEGORY_ICONS = [
  { category: "networth", icon: "heroicons:chart-bar" },
  { category: "cash", icon: "heroicons:banknotes" },
  { category: "collector", icon: "heroicons:archive-box" },
  { category: "website", icon: "heroicons:globe-alt" },
];

function badgeIcon(id: string, category: string) {
  const match = BADGE_ICONS.find((entry) => id.startsWith(entry.prefix));
  const tier = match?.prefix.endsWith("_") ? id.slice(match.prefix.length) : "";
  return {
    icon:
      match?.icon ??
      CATEGORY_ICONS.find((entry) => entry.category === category)?.icon ??
      "heroicons:star",
    tier: id.startsWith("limited_") ? `${tier}%` : tier.toUpperCase(),
  };
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const { url, headers } = buildApiFetchRequest(PUBLIC_API_URL, path);
  const response = await fetch(url, { headers, signal });
  if (!response.ok)
    throw new Error(`Failed to load badges (${response.status})`);
  return response.json();
}

export default function BadgesSection({ userId }: { userId: string }) {
  const [showLocked, setShowLocked] = useState(false);
  const badgesQuery = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: ({ signal }) =>
      getJson<BadgeProgress[]>(
        `/v2/users/${encodeURIComponent(userId)}/badges/progress`,
        signal,
      ),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (badgesQuery.isPending) return null;

  const badges = badgesQuery.data ?? [];
  const earnedBadges = badges.filter((badge) => badge.earned);
  const lockedBadges = badges.filter((badge) => !badge.earned);

  const renderBadge = (badge: BadgeProgress) => {
    const { earned } = badge;
    const badgeNumber =
      earned && badge.number != null
        ? `#${badge.number.toLocaleString("en-US")} of ${badge.holders.toLocaleString("en-US")}`
        : null;
    const { icon, tier } = badgeIcon(badge.id, badge.category);
    const showProgress = !earned && badge.target != null && badge.target > 1;
    const percent = showProgress
      ? Math.min(badge.current / badge.target!, 1) * 100
      : 0;
    return (
      <li key={badge.id}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${badge.name}${earned ? "" : " (locked)"}`}
              className="focus-visible:ring-link flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <div
                className={cn(
                  "border-border-card bg-tertiary-bg flex flex-col items-center justify-center rounded-xl border size-16",
                  !earned && "opacity-35 grayscale",
                )}
              >
                <Icon
                  icon={icon}
                  className={cn(
                    "size-7",
                    earned ? "text-button-info" : "text-secondary-text",
                  )}
                />
                {tier && (
                  <span className="text-primary-text text-[10px] leading-tight font-semibold">
                    {tier}
                  </span>
                )}
              </div>
              {showProgress ? (
                <div
                  role="progressbar"
                  aria-label={`${badge.name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                  className="bg-secondary-text/20 h-1 w-16 overflow-hidden rounded-full"
                >
                  <div
                    className="bg-link/50 h-full rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              ) : (
                <div aria-hidden className="h-1" />
              )}
              <span
                className={cn(
                  "line-clamp-2 text-center text-xs leading-tight font-medium",
                  earned ? "text-primary-text" : "text-secondary-text",
                )}
              >
                {badge.name}
              </span>
              {badgeNumber && (
                <span
                  aria-label={badgeNumber}
                  className="text-secondary-text text-center text-xs whitespace-nowrap"
                >
                  #{compactNumber.format(badge.number!)} of{" "}
                  {compactNumber.format(badge.holders)}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-1 p-3 text-sm">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-secondary-text">{badge.description}</p>
            {badgeNumber && (
              <p className="text-secondary-text text-xs">{badgeNumber}</p>
            )}
            <p className="text-secondary-text text-xs">
              {earned
                ? badge.earned_at
                  ? `Earned ${formatMonthDayYear(badge.earned_at)}`
                  : "Earned"
                : showProgress
                  ? `${formatNumber(badge.current)} / ${formatNumber(badge.target!)}`
                  : "Not earned yet"}
            </p>
          </PopoverContent>
        </Popover>
      </li>
    );
  };

  return (
    <section className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
      <h2 className="text-primary-text mb-3 text-lg font-semibold">
        Badges{" "}
        <span className="text-secondary-text ml-1 text-sm font-normal">
          {earnedBadges.length}/{badges.length}
        </span>
      </h2>
      {badgesQuery.isError ? (
        <ProfileTabError
          title="Failed to load badges"
          message={badgesQuery.error.message}
          onRetry={() => void badgesQuery.refetch()}
        />
      ) : (
        <>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3">
            {(earnedBadges.length > 0 ? earnedBadges : lockedBadges).map(
              renderBadge,
            )}
          </ul>
          {earnedBadges.length > 0 && lockedBadges.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                aria-expanded={showLocked}
                aria-controls="locked-badges"
                onClick={() => setShowLocked((open) => !open)}
              >
                {showLocked
                  ? "Hide locked"
                  : `Show locked (${lockedBadges.length})`}
                <Icon
                  icon="heroicons:chevron-down"
                  className={cn(
                    "transition-transform",
                    showLocked && "rotate-180",
                  )}
                />
              </Button>
              {showLocked && (
                <ul
                  id="locked-badges"
                  className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3"
                >
                  {lockedBadges.map(renderBadge)}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
