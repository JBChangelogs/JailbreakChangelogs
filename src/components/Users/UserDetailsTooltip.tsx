import React from "react";
import Link from "next/link";
import { UserData } from "@/types/auth";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { formatRelativeDate } from "@/utils/timestamp";
import { UserAvatar } from "@/utils/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";

interface UserDetailsTooltipProps {
  user: UserData;
}

export const UserDetailsTooltip: React.FC<UserDetailsTooltipProps> = ({
  user,
}) => {
  // Don't show tooltip for private profiles
  if (user.settings?.profile_public === 0) {
    return (
      <div className="p-2">
        <div className="flex gap-3">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#2E3944]">
            <svg
              className="h-8 w-8 text-[#FFFFFF]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-muted text-lg font-semibold">
              Private Profile
            </div>
            <p className="text-muted text-sm">
              This user&apos;s profile is private
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex gap-3">
        {/* User Avatar */}
        <UserAvatar
          userId={user.id}
          avatarHash={user.avatar}
          username={user.username}
          size={16}
          accent_color={user.accent_color}
          custom_avatar={user.custom_avatar}
          showBadge={false}
          settings={user.settings}
          showBorder={true}
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
                <h3 className="text-muted text-lg font-semibold transition-colors hover:text-blue-300">
                  {user.global_name && user.global_name !== "None"
                    ? user.global_name
                    : user.username}
                </h3>
                <UserBadges
                  usernumber={user.usernumber}
                  premiumType={user.premiumtype}
                  flags={user.flags}
                  size="sm"
                />
              </div>
              <p className="text-sm text-[#B9BBBE]">@{user.username}</p>
            </Link>
          </div>

          <div className="space-y-1 text-sm">
            {/* Roblox Connection */}
            {user.roblox_id && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white">
                  <RobloxIcon className="h-3 w-3" />
                  {user.roblox_username}
                </span>
              </div>
            )}

            {/* Additional Info */}
            <p className="text-muted">Member #{user.usernumber}</p>
            <p className="text-muted">
              Joined {formatRelativeDate(parseInt(user.created_at) * 1000)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
