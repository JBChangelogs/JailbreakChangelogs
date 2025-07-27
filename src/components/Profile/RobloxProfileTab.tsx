'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RobloxIcon } from '@/components/Icons/RobloxIcon';
import { formatShortDate, formatCustomDate } from '@/utils/timestamp';
import TradeAdsTab from './TradeAdsTab';
import { CircularProgress, Tooltip } from '@mui/material';

interface User {
  id: string;
  roblox_id?: string | null;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
  roblox_join_date?: number;
}

interface RobloxProfileTabProps {
  user: User;
}

export default function RobloxProfileTab({ user }: RobloxProfileTabProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="space-y-6">
      {/* Roblox Profile Card */}
      <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
        <div className="flex items-center gap-2 mb-4">
          <RobloxIcon className="text-white h-6 w-6" />
          <h2 className="text-lg font-semibold text-muted">Roblox Profile</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Roblox Avatar */}
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-[#5865F2]">
            {!imageError && user.roblox_avatar ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#212A31]">
                    <CircularProgress size={32} sx={{ color: '#5865F2' }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-[#212A31]">
                  <Image
                    src={user.roblox_avatar}
                    alt={`${user.roblox_display_name || user.roblox_username || 'Roblox'} user's profile picture`}
                    fill
                    unoptimized
                    draggable={false}
                    className="object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#212A31] flex items-center justify-center">
                <RobloxIcon className="text-white h-12 w-12" />
              </div>
            )}
          </div>

          {/* Roblox Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="space-y-2">
              <div>
                <h3 className="text-xl font-semibold text-muted">{user.roblox_display_name || user.roblox_username}</h3>
                <p className="text-[#FFFFFF]">@{user.roblox_username}</p>
              </div>
              
              <div className="text-sm text-[#FFFFFF]">
                {user.roblox_join_date && (
                  <Tooltip 
                    title={formatCustomDate(user.roblox_join_date)}
                    placement="top"
                    arrow
                    enterDelay={200}
                    leaveDelay={0}
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: '#0F1419',
                          color: '#D3D9D4',
                          fontSize: '0.75rem',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #2E3944',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          '& .MuiTooltip-arrow': {
                            color: '#0F1419',
                          }
                        }
                      }
                    }}
                  >
                    <span className="cursor-help inline-block">Member since {formatShortDate(user.roblox_join_date)}</span>
                  </Tooltip>
                )}
              </div>

              {user.roblox_id && (
                <div className="pt-2">
                  <Link
                    href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors"
                  >
                    <RobloxIcon className="h-5 w-5" />
                    <span>View Roblox Profile</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Ads Section */}
      <TradeAdsTab userId={user.id} />
    </div>
  );
} 