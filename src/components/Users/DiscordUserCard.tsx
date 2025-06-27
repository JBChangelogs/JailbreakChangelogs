import { UserAvatar } from '@/utils/avatar';
import { UserSettings } from '@/types/auth';
import { Tooltip } from '@mui/material';
import { TrophyIcon } from '@heroicons/react/24/solid';

interface DiscordUserCardProps {
  user: {
    id: string;
    username: string;
    avatar: string;
    global_name: string;
    usernumber: number;
    accent_color: string;
    custom_avatar?: string;
    settings?: UserSettings;
    premiumtype?: number;
  };
  currentUserId: string | null;
}

export default function DiscordUserCard({ user, currentUserId }: DiscordUserCardProps) {
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <UserAvatar
        userId={user.id}
        avatarHash={user.avatar}
        username={user.username}
        size={12}
        accent_color={user.accent_color}
        custom_avatar={user.custom_avatar}
        showBadge={false}
        settings={user.settings}
        premiumType={user.premiumtype}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h2 className="text-base font-semibold text-[#FFFFFF] truncate group-hover:text-blue-300 transition-colors max-w-[180px] sm:max-w-[250px]">
            {user.global_name && user.global_name !== "None" ? user.global_name : user.username}
          </h2>
          {user.premiumtype ? (
            <Tooltip title={`Supporter Type ${user.premiumtype}`}> 
              <div
                className={`inline-flex items-center justify-center rounded-full ${user.premiumtype === 1 ? 'bg-gradient-to-r from-[#CD7F32] to-[#B87333]' : user.premiumtype === 2 ? 'bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]' : 'bg-gradient-to-r from-[#FFD700] to-[#DAA520]'} text-black cursor-pointer hover:opacity-90 w-4 h-4`}
                style={{ minWidth: '1rem', minHeight: '1rem' }}
              >
                <TrophyIcon className="w-3 h-3" />
              </div>
            </Tooltip>
          ) : null}
        </div>
        <p className="text-sm text-[#B9BBBE] truncate group-hover:text-blue-300 transition-colors max-w-[180px] sm:max-w-[250px]">@{user.username}</p>
      </div>
    </div>
  );
} 