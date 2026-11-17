"use client";

import { useState } from "react";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { getProfileBanner } from "@/components/Profile/Banner";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { UserBadges } from "@/components/Profile/UserBadges";
import { UserAvatar } from "@/utils/ui/avatar";
import {
  formatMonthDayYear,
  formatRelativeDate,
} from "@/utils/helpers/timestamp";
import {
  type UserSettingsV2,
  type UserPresence,
  type UserFlag,
} from "@/types/auth";

interface DiscordUserCardProps {
  user: {
    id: string;
    username: string;
    avatar_url: string;
    banner_url?: string | null;
    banner?: string | null;
    custom_banner?: string | null;
    global_name: string;
    usernumber: number;
    created_at?: string | number | null;
    roblox_id?: string | null;
    roblox_username?: string | null;
    roblox_display_name?: string | null;
    custom_avatar?: string;
    settings?: UserSettingsV2;
    premiumtype?: number;
    presence?: UserPresence;
    primary_guild?: {
      tag: string | null;
      badge: string | null;
      identity_enabled: boolean;
      identity_guild_id: string | null;
    } | null;
    flags?: UserFlag[];
  };
  disableBadgeTooltips?: boolean;
  badgeLimit?: number;
}

export default function DiscordUserCard({
  user,
  disableBadgeTooltips = false,
  badgeLimit,
}: DiscordUserCardProps) {
  const presence = user.settings?.hide_presence ? undefined : user.presence;
  const joined = Number(user.created_at);
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null);
  const { primary, fallback } = getProfileBanner({
    userId: user.id,
    bannerUrl: user.banner_url,
  });
  const bannerSrc = primary && primary !== failedBannerUrl ? primary : fallback;

  return (
    <div className="flex h-full flex-col">
      <div className="bg-tertiary-bg relative h-24 overflow-hidden">
        <Image
          placeholder={IMAGE_PLACEHOLDER}
          src={bannerSrc}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          draggable={false}
          onError={
            bannerSrc === primary
              ? () => setFailedBannerUrl(primary)
              : undefined
          }
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Ring in the card colour so the avatar sits cleanly over the banner. */}
        <div className="flex items-end justify-between gap-2">
          <div
            className={`bg-secondary-bg relative -mt-9 w-fit p-1 ${user.premiumtype === 3 ? "rounded-[28%]" : "rounded-full"}`}
          >
            <UserAvatar
              userId={user.id}
              avatarUrl={user.avatar_url}
              username={user.username}
              size={16}
              isOnline={presence?.status === "Online"}
              showBadge={true}
              presenceBadgeClassName="border-secondary-bg"
              settings={user.settings}
              premiumType={user.premiumtype}
            />
          </div>
          {presence?.status === "Online" ? (
            <span className="text-status-success-vibrant bg-status-success-vibrant/10 in-[[data-accent-cards]]:text-primary-text in-[[data-accent-cards]]:bg-tertiary-bg inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
              <span className="bg-status-success-vibrant size-1.5 rounded-full" />
              Online
            </span>
          ) : presence?.last_updated ? (
            <span className="text-secondary-text text-xs">
              Active {formatRelativeDate(presence.last_updated)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex h-6 min-w-0 items-center gap-2">
          <h2 className="text-primary-text group-hover:text-link min-w-0 truncate text-base font-semibold transition-colors">
            {user.global_name && user.global_name !== "None"
              ? user.global_name
              : user.username}
          </h2>
          <UserBadges
            usernumber={user.usernumber}
            premiumType={user.premiumtype}
            flags={user.flags}
            primary_guild={user.primary_guild}
            size="sm"
            className="flex shrink-0 gap-1"
            disableTooltips={disableBadgeTooltips}
            disableClick
            limit={badgeLimit}
          />
        </div>
        <p className="text-secondary-text truncate text-sm">@{user.username}</p>
        {/* Always rendered so every card has the same height. */}
        <p className="text-secondary-text mt-3 mb-3 flex h-5 min-w-0 items-center gap-1.5 text-sm">
          {user.roblox_username ? (
            <>
              <RobloxIcon className="size-3.5 shrink-0" />
              <span className="text-primary-text truncate">
                {user.roblox_display_name || user.roblox_username}
              </span>
              {user.roblox_display_name &&
                user.roblox_display_name !== user.roblox_username && (
                  <span className="truncate">@{user.roblox_username}</span>
                )}
            </>
          ) : (
            <>
              <RobloxIcon className="size-3.5 shrink-0 opacity-50" />
              <span className="opacity-70">No Roblox account linked</span>
            </>
          )}
        </p>
        <div className="border-border-card text-secondary-text mt-auto flex items-center gap-2 border-t pt-3 text-xs">
          <>
            <span>Member #{user.usernumber.toLocaleString("en-US")}</span>
            {joined > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>Joined {formatMonthDayYear(joined)}</span>
              </>
            )}
          </>
        </div>
      </div>
    </div>
  );
}
