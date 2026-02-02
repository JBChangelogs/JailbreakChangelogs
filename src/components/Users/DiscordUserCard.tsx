"use client";

import { UserBadges } from "@/components/Profile/UserBadges";
import { UserAvatar } from "@/utils/avatar";
import {
  type UserSettings,
  type UserPresence,
  type UserFlag,
} from "@/types/auth";

interface DiscordUserCardProps {
  user: {
    id: string;
    username: string;
    avatar: string;
    global_name: string;
    usernumber: number;
    custom_avatar?: string;
    settings?: UserSettings;
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
}

export default function DiscordUserCard({
  user,
  disableBadgeTooltips = false,
}: DiscordUserCardProps) {
  return (
    <div className="flex items-center space-x-3">
      <UserAvatar
        userId={user.id}
        avatarHash={user.avatar}
        username={user.username}
        size={12}
        custom_avatar={user.custom_avatar}
        showBadge={false}
        settings={user.settings}
        premiumType={user.premiumtype}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-primary-text group-hover:text-link max-w-full truncate text-base font-semibold transition-colors sm:max-w-[250px]">
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
            className="flex flex-wrap gap-1"
            disableTooltips={disableBadgeTooltips}
          />
        </div>
        <p className="text-secondary-text max-w-[180px] truncate text-sm sm:max-w-[250px]">
          @{user.username}
        </p>
      </div>
    </div>
  );
}
