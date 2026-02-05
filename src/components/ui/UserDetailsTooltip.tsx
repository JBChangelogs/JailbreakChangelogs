import React from "react";
import Link from "next/link";
import { UserData } from "@/types/auth";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { formatRelativeDate } from "@/utils/timestamp";
import { UserAvatar } from "@/utils/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";

interface UserDetailsTooltipProps {
  user: UserData;
  currentUserId?: string | null;
}

export const UserDetailsTooltip: React.FC<UserDetailsTooltipProps> = ({
  user,
  currentUserId,
}) => {
  return (
    <div className="p-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-3">
        {/* User Avatar */}
        <Link
          href={`/users/${user.id}`}
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          <UserAvatar
            userId={user.id}
            avatarHash={user.avatar}
            username={user.username}
            size={16}
            custom_avatar={user.custom_avatar}
            showBadge={false}
            settings={user.settings}
            premiumType={user.premiumtype}
          />
        </Link>

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${user.id}`}
                prefetch={false}
                className="hover:text-button-info transition-colors"
              >
                <h3 className="text-primary-text max-w-[300px] truncate text-lg font-semibold">
                  {user.global_name && user.global_name !== "None"
                    ? user.global_name
                    : user.username}
                </h3>
              </Link>
              <UserBadges
                usernumber={user.usernumber}
                premiumType={user.premiumtype}
                flags={user.flags}
                primary_guild={user.primary_guild}
                size="sm"
                disableTooltips={true}
              />
            </div>
            <Link
              href={`/users/${user.id}`}
              prefetch={false}
              className="text-secondary-text hover:text-primary-text block text-sm transition-colors"
            >
              @{user.username}
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            {/* Connection Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://discord.com/users/${user.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-text bg-tertiary-bg/40 border-border-primary hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
              >
                <DiscordIcon className="h-3.5 w-3.5" />
                Discord
              </a>

              {user.roblox_id && (
                <a
                  href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-text bg-tertiary-bg/40 border-border-primary hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
                >
                  <RobloxIcon className="h-3.5 w-3.5" />
                  Roblox
                </a>
              )}
            </div>

            {/* Additional Info */}
            {user.settings?.profile_public === 0 &&
            currentUserId !== user.id ? (
              <p className="text-secondary-text text-sm italic">
                Profile is private
              </p>
            ) : (
              <p className="text-secondary-text">
                Member #{user.usernumber} since{" "}
                {formatRelativeDate(parseInt(user.created_at) * 1000)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
