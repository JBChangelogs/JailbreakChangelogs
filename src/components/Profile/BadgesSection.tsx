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

interface BadgeDefinition {
  category: string;
  name: string;
  description: string;
}

const BADGE_ICONS = [
  { prefix: "networth_", icon: "heroicons:chart-bar" },
  { prefix: "cash_", icon: "heroicons:banknotes" },
  { prefix: "collector_seasons_", icon: "heroicons:calendar-days" },
  { prefix: "collector_all", icon: "heroicons:trophy" },
  { prefix: "limited_", icon: "heroicons:sparkles" },
  { prefix: "verified", icon: "heroicons:check-badge" },
  { prefix: "theme_winner", icon: "heroicons:paint-brush" },
  { prefix: "veteran", icon: "heroicons:clock" },
  { prefix: "trade_ads_", icon: "heroicons:arrows-right-left" },
  { prefix: "group_member", icon: "heroicons:user-group" },
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
    queryFn: async ({ signal }) => {
      const [all, earned] = await Promise.all([
        getJson<Record<string, BadgeDefinition>>("/v2/badges", signal),
        getJson<{ id: string; earned_at: number }[]>(
          `/v2/users/${encodeURIComponent(userId)}/badges`,
          signal,
        ),
      ]);
      return { all, earned };
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (badgesQuery.isPending) return null;

  const all = badgesQuery.data?.all ?? {};
  const earnedAt = new Map(
    badgesQuery.data?.earned
      .filter((badge) => all[badge.id])
      .map((badge) => [badge.id, badge.earned_at]),
  );
  const earnedIds = [...earnedAt.keys()];
  const lockedIds = Object.keys(all).filter((id) => !earnedAt.has(id));

  const renderBadge = (id: string) => {
    const badge = all[id];
    const earned = earnedAt.get(id);
    const { icon, tier } = badgeIcon(id, badge.category);
    return (
      <li key={id} className="w-24">
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
              <span
                className={cn(
                  "line-clamp-2 text-center text-xs leading-tight font-medium",
                  earned ? "text-primary-text" : "text-secondary-text",
                )}
              >
                {badge.name}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-1 p-3 text-sm">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-secondary-text">{badge.description}</p>
            <p className="text-secondary-text text-xs">
              {earned
                ? `Earned ${formatMonthDayYear(earned)}`
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
          {earnedIds.length}/{earnedIds.length + lockedIds.length}
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
          {earnedIds.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {earnedIds.map((id) => renderBadge(id))}
            </ul>
          ) : (
            <p className="text-secondary-text text-sm">No badges yet</p>
          )}
          {lockedIds.length > 0 && (
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
                  : `Show locked (${lockedIds.length})`}
                <Icon
                  icon="heroicons:chevron-down"
                  className={cn(
                    "transition-transform",
                    showLocked && "rotate-180",
                  )}
                />
              </Button>
              {showLocked && (
                <ul id="locked-badges" className="mt-3 flex flex-wrap gap-3">
                  {lockedIds.map((id) => renderBadge(id))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
