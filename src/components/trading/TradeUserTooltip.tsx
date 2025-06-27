import React from 'react';
import Link from 'next/link';
import { RobloxIcon } from '@/components/Icons/RobloxIcon';
import { UserAvatar } from '@/utils/avatar';

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
    premiumtype?: string;
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
          accent_color={user.accent_color}
          custom_avatar={user.custom_avatar}
          showBadge={false}
          settings={user.settings}
          showBorder={false}
          premiumType={user.premiumtype as unknown as number}
        />

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <Link 
              href={`/users/${user.id}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-muted hover:text-blue-300 transition-colors">
                  {user.global_name && user.global_name !== "None" ? user.global_name : user.username}
                </h3>
              </div>
              <p className="text-sm text-[#B9BBBE]">@{user.username}</p>
            </Link>
          </div>

          <div className="space-y-1 text-sm">
            {/* Roblox Connection */}
            {user.roblox_id && user.roblox_username && (
              <div className="flex gap-2 items-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/10 text-white border border-white/20">
                  <RobloxIcon className="w-3 h-3" />
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