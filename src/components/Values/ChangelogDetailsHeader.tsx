import React from "react";
import Link from "next/link";
import { UserAvatar } from "@/utils/ui/avatar";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import NitroValuesChangelogDetailVideoPlayer from "@/components/Ads/NitroValuesChangelogDetailVideoPlayer";

interface UserData {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string;
  accent_color: string;
  custom_avatar?: string;
  settings_v2?: {
    custom_avatar: boolean;
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
      metadata?: {
        avatar?: string;
        avatar_hash?: string;
        premiumtype?: number;
      };
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
}) => {
  // Get unique contributors with their Discord IDs and avatar URLs
  // Only include people who made suggestions, not people who made changes
  const allContributors = new Map<
    string,
    { name: string; avatarUrl?: string; premiumtype?: number }
  >();

  changelog.change_data.forEach((change) => {
    if (change.suggestion?.suggestor_name && change.suggestion.user_id) {
      const userId = String(change.suggestion.user_id);
      const existing = allContributors.get(userId);

      if (
        !existing ||
        (!existing.avatarUrl && change.suggestion.metadata?.avatar)
      ) {
        allContributors.set(userId, {
          name: change.suggestion.suggestor_name,
          avatarUrl: change.suggestion.metadata?.avatar,
          premiumtype: change.suggestion.metadata?.premiumtype,
        });
      }
    }
  });

  const sortedContributors = Array.from(allContributors.entries()).sort(
    ([, dataA], [, dataB]) =>
      dataA.name.toLowerCase().localeCompare(dataB.name.toLowerCase()),
  );

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1">
          <h1 className="text-primary-text mb-2 text-3xl font-bold">
            Changelog #{changelog.id}
          </h1>
          <p className="text-secondary-text mb-4">
            {changelog.change_count} change
            {changelog.change_count !== 1 ? "s" : ""} • Posted on{" "}
            {formatMessageDate(changelog.created_at * 1000)}
          </p>

          {/* Contributors */}
          <div className="mt-4">
            <h3 className="text-primary-text mb-2 text-sm font-medium">
              Contributors ({sortedContributors.length}):
            </h3>
            <div className="flex flex-wrap gap-2">
              {sortedContributors.map(([userId, contributorData], index) => (
                <span key={userId} className="flex items-center gap-1">
                  <UserAvatar
                    userId={userId}
                    avatarHash={null}
                    username={contributorData.name}
                    forceAvatarUrl={contributorData.avatarUrl ?? undefined}
                    premiumType={contributorData.premiumtype ?? 0}
                    size={8}
                    showBadge={false}
                    bgClassName="bg-tertiary-bg"
                  />
                  <Link
                    href={`/users/${userId}`}
                    prefetch={false}
                    className="text-link hover:text-link-hover text-sm hover:underline"
                  >
                    {contributorData.name}
                  </Link>
                  {index < sortedContributors.length - 1 && (
                    <span className="text-secondary-text text-sm">,</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        <NitroValuesChangelogDetailVideoPlayer className="w-full self-center lg:self-start" />
      </div>
    </div>
  );
};

export default ChangelogDetailsHeader;
