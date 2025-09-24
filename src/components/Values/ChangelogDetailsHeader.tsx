import React from "react";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";
import { formatMessageDate } from "@/utils/timestamp";

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

const ChangelogDetailsHeader: React.FC<ChangelogDetailsHeaderProps> = ({
  changelog,
  userData,
}) => {
  // Get unique contributors with their Discord IDs
  // Only include people who made suggestions, not people who made changes
  const allContributors = new Map<string, string>();

  changelog.change_data.forEach((change) => {
    // Only include people who made suggestions
    if (change.suggestion?.suggestor_name && change.suggestion.user_id) {
      const userId = String(change.suggestion.user_id);
      // Use Discord ID as the key to avoid duplicates
      allContributors.set(userId, change.suggestion.suggestor_name);
    }
  });

  const sortedContributors = Array.from(allContributors.entries()).sort(
    ([, nameA], [, nameB]) =>
      nameA.toLowerCase().localeCompare(nameB.toLowerCase()),
  );

  return (
    <div className="border-border-primary bg-secondary-bg rounded-lg border p-6">
      <h1 className="text-primary-text mb-2 text-3xl font-bold">
        Changelog #{changelog.id}
      </h1>
      <p className="text-secondary-text mb-4">
        {changelog.change_count} change{changelog.change_count !== 1 ? "s" : ""}{" "}
        • Posted on {formatMessageDate(changelog.created_at * 1000)}
      </p>

      {/* Contributors */}
      <div className="mt-4">
        <h3 className="text-secondary-text mb-2 text-sm font-medium">
          Contributors ({sortedContributors.length}):
        </h3>
        <div className="flex flex-wrap gap-2">
          {sortedContributors.map(([discordId, contributorName], index) => (
            <span key={discordId} className="flex items-center gap-1">
              <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                <DefaultAvatar />
                {userData[discordId]?.avatar &&
                  userData[discordId]?.avatar !== "None" && (
                    <Image
                      src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${discordId}/${userData[discordId].avatar}?size=64`)}`}
                      alt={contributorName}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (
                          e as unknown as { currentTarget: HTMLElement }
                        ).currentTarget.style.display = "none";
                      }}
                    />
                  )}
              </div>
              <a
                href={`https://discord.com/users/${discordId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover text-sm hover:underline"
              >
                {contributorName}
              </a>
              {index < sortedContributors.length - 1 && (
                <span className="text-secondary-text text-sm">,</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogDetailsHeader;
