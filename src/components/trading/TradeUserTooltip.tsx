import React from "react";
import Link from "next/link";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { UserAvatar } from "@/utils/ui/avatar";

interface TradeUserTooltipProps {
  user: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    roblox_id?: string;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
    accent_color?: string;
    custom_avatar?: string;
    settings?: {
      avatar_discord: number;
    };
    premiumtype?: number;
  };
}

export const TradeUserTooltip: React.FC<TradeUserTooltipProps> = ({ user }) => {
  return (
    <div className="p-2">
      <div className="flex gap-3">
        {/* User Avatar */}
        <UserAvatar
          userId={user.id}
          avatarHash={user.avatar || null}
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
                <h3 className="text-primary-text hover:text-link text-lg font-semibold transition-colors">
                  {user.global_name && user.global_name !== "None"
                    ? user.global_name
                    : user.username}
                </h3>
              </div>
              <p className="text-secondary-text text-sm">@{user.username}</p>
            </Link>
          </div>

          <div className="space-y-1 text-sm">
            {/* Roblox Connection */}
            {user.roblox_id && user.roblox_username && (
              <div className="flex items-center gap-2">
                <span className="border-primary-text text-primary-text inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs">
                  <RobloxIcon className="h-3 w-3" />
                  {user.roblox_username}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
