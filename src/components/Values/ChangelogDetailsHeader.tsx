import React from 'react';
import Image from 'next/image';
import { DefaultAvatar } from '@/utils/avatar';
import { formatMessageDate } from '@/utils/timestamp';

interface UserData {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string;
  accent_color: string;
  custom_avatar?: string;
  settings?: {
    avatar_discord: number;
  };
  premiumtype?: number;
}

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: Array<{
    changed_by: string;
    changed_by_id: string;
    suggestion?: {
      suggestor_name: string;
      user_id: number | string;
    };
  }>;
  created_at: number;
}

interface ChangelogDetailsHeaderProps {
  changelog: ChangelogGroup;
  userData: Record<string, UserData>;
}

const ChangelogDetailsHeader: React.FC<ChangelogDetailsHeaderProps> = ({ changelog, userData }) => {
  // Get unique contributors with their Discord IDs
  // Only include people who made suggestions, not people who made changes
  const allContributors = new Map<string, string>();
  
  changelog.change_data.forEach(change => {
    // Only include people who made suggestions
    if (change.suggestion?.suggestor_name && change.suggestion.user_id) {
      const userId = String(change.suggestion.user_id);
      // Use Discord ID as the key to avoid duplicates
      allContributors.set(userId, change.suggestion.suggestor_name);
    }
  });
  
  const sortedContributors = Array.from(allContributors.entries()).sort(([, nameA], [, nameB]) => 
    nameA.toLowerCase().localeCompare(nameB.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-r from-[#2A3441] to-[#1E252B] rounded-lg p-6 border border-[#37424D]">
      <h1 className="text-3xl font-bold text-white mb-2">
        Changelog #{changelog.id}
      </h1>
      <p className="text-[#D3D9D4] mb-4">
        {changelog.change_count} change{changelog.change_count !== 1 ? 's' : ''} • Posted on {formatMessageDate(changelog.created_at * 1000)}
      </p>
      
      {/* Contributors */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[#D3D9D4] mb-2">
          Contributors ({sortedContributors.length}):
        </h3>
        <div className="flex flex-wrap gap-2">
          {sortedContributors.map(([discordId, contributorName], index) => (
            <span key={discordId} className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2E3944] relative flex-shrink-0">
                <DefaultAvatar />
                {userData[discordId]?.avatar && userData[discordId]?.avatar !== 'None' && (
                  <Image
                    src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${discordId}/${userData[discordId].avatar}?size=64`)}`}
                    alt={contributorName}
                    fill
                    className="object-cover"
                    onError={(e) => { (e as unknown as { currentTarget: HTMLElement }).currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <a
                href={`https://discord.com/users/${discordId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#40C0E7] hover:text-[#2B9CD9] hover:underline text-sm"
              >
                {contributorName}
              </a>
              {index < sortedContributors.length - 1 && (
                <span className="text-[#D3D9D4] text-sm">,</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogDetailsHeader;
