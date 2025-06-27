import { useState } from 'react';
import Image from 'next/image';
import { CircularProgress } from '@mui/material';
import { RobloxIcon } from '@/components/Icons/RobloxIcon';
import { formatShortDate } from '@/utils/timestamp';

interface RobloxUserCardProps {
  user: {
    id: string;
    roblox_id?: string | null;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
    roblox_join_date?: number;
    settings?: {
      profile_public: number;
    };
  };
  currentUserId: string | null;
}

export default function RobloxUserCard({ user, currentUserId }: RobloxUserCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPrivate = user.settings?.profile_public === 0 && currentUserId !== user.id;

  if (isPrivate) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-[#1E2328] flex items-center justify-center border border-[#2E3944]">
          <svg className="w-6 h-6 text-[#FFFFFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-muted truncate group-hover:text-[#5865F2] transition-colors">Hidden User</h2>
          <p className="text-sm text-[#FFFFFF] truncate group-hover:text-[#5865F2] transition-colors">Private Profile</p>
          <p className="text-sm text-[#FFFFFF]">Joined ???</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {!avatarError && user.roblox_avatar ? (
        <div className="relative w-12 h-12">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#2E3944] rounded-full">
              <CircularProgress size={24} sx={{ color: '#5865F2' }} />
            </div>
          )}
          <Image
            src={user.roblox_avatar}
            alt={`${user.roblox_display_name || user.roblox_username || 'Roblox'} user's profile picture`}
            fill
            unoptimized
            draggable={false}
            className="rounded-full border border-[#2E3944] object-cover"
            onError={() => setAvatarError(true)}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-[#1E2328] flex items-center justify-center border border-[#2E3944]">
          <RobloxIcon className="w-6 h-6 text-[#FFFFFF]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-[#FFFFFF] truncate group-hover:text-blue-300 transition-colors max-w-[180px] sm:max-w-[250px]">
          {user.roblox_display_name || user.roblox_username || 'Roblox User'}
        </h2>
        <p className="text-sm text-[#B9BBBE] truncate group-hover:text-blue-300 transition-colors max-w-[180px] sm:max-w-[250px]">
          @{user.roblox_username || 'unknown'}
        </p>
        <p className="text-sm text-[#72767D]">
          {user.roblox_join_date ? `Joined ${formatShortDate(user.roblox_join_date)}` : 'Unknown join date'}
        </p>
      </div>
    </div>
  );
} 