"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tooltip } from '@mui/material';
import { RobloxIcon } from '@/components/Icons/RobloxIcon';
import { TradeUserTooltip } from './TradeUserTooltip';

interface RobloxTradeUserProps {
  user: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    roblox_id?: string;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
  };
  showBadge?: boolean;
}

export default function RobloxTradeUser({ user, showBadge = false }: RobloxTradeUserProps) {
  const [imageError, setImageError] = useState(false);

  if (!user.roblox_id || !user.roblox_username) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        {!imageError && user.roblox_avatar ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#212A31]">
            <Image
              src={user.roblox_avatar}
              alt={`${user.roblox_display_name || user.roblox_username || 'Roblox'} user's profile picture`}
              fill
              draggable={false}
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-[#212A31] rounded-full flex items-center justify-center">
            <RobloxIcon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        {showBadge && (
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#2E3944] border border-[#37424D]">
              <RobloxIcon className="h-3 w-3 text-[#FF5630]" />
              <span className="text-xs text-[#FFFFFF]">Roblox</span>
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <Tooltip
            title={<TradeUserTooltip user={user} />}
            arrow
            disableTouchListener
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: '#1A2228',
                  border: '1px solid #2E3944',
                  maxWidth: '400px',
                  width: 'auto',
                  minWidth: '300px',
                  '& .MuiTooltip-arrow': {
                    color: '#1A2228',
                  },
                },
              },
            }}
          >
            <Link
              href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-400 transition-colors font-medium truncate inline-block"
            >
              {user.roblox_display_name || user.roblox_username}
            </Link>
          </Tooltip>
          {user.roblox_display_name && (
            <span className="text-xs text-[#FFFFFF] truncate">@{user.roblox_username}</span>
          )}
        </div>
      </div>
    </div>
  );
} 