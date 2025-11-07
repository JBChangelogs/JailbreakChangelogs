import React from "react";
import Link from "next/link";
import { UserData } from "@/types/auth";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { formatRelativeDate } from "@/utils/timestamp";
import { UserAvatar } from "@/utils/avatar";

interface UserDetailsTooltipProps {
  user: UserData;
  currentUserId?: string | null;
}

export const UserDetailsTooltip: React.FC<UserDetailsTooltipProps> = ({
  user,
  currentUserId,
}) => {
  return (
    <div className="bg-secondary-bg p-2">
      <div className="flex gap-3">
        {/* User Avatar */}
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

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <Link
              href={`/users/${user.id}`}
              prefetch={false}
              className="block transition-opacity hover:opacity-80"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-primary-text hover:text-link max-w-[300px] truncate text-lg font-semibold transition-colors">
                  {user.global_name && user.global_name !== "None"
                    ? user.global_name
                    : user.username}
                </h3>
              </div>
              <p className="text-secondary-text text-sm">@{user.username}</p>
            </Link>
          </div>

          <div className="space-y-1 text-sm">
            {/* Connection Badges */}
            <div className="flex items-center gap-2">
              {/* Discord Connection */}
              <span className="text-primary-text border-primary-text inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs">
                <DiscordIcon className="h-3 w-3" />
                Discord
              </span>

              {/* Roblox Connection */}
              {user.roblox_id && (
                <span className="text-primary-text border-primary-text inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs">
                  <RobloxIcon className="h-3 w-3" />
                  Roblox
                </span>
              )}
            </div>

            {/* Additional Info */}
            {user.settings?.profile_public === 0 &&
            currentUserId !== user.id ? (
              <p className="text-secondary-text text-sm italic">
                Profile is private
              </p>
            ) : (
              <>
                <p className="text-secondary-text">Member #{user.usernumber}</p>
                <p className="text-secondary-text">
                  Joined {formatRelativeDate(parseInt(user.created_at) * 1000)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
