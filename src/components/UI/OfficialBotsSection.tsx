"use client";

import { useOfficialBotsQuery } from "@/hooks/useOfficialBotsQuery";
import { Icon } from "./IconWrapper";
import Image from "next/image";
import CopyButton from "@/app/inventories/CopyButton";
import { DefaultAvatar } from "@/utils/avatar";

// Skeleton loader for official bots section
function OfficialBotsSkeleton() {
  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Official Scan Bots
      </h2>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="mb-3">
          <p className="text-secondary-text text-sm">
            These are our official inventory scanning bots. Only these accounts
            are authorized to scan inventories on our behalf.
          </p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border-border-primary bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="bg-status-success text-form-button-text flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                  <Icon
                    icon="ri:verified-badge-fill"
                    className="h-4 w-4"
                    inline={true}
                  />
                </div>
                <div className="bg-surface-bg h-10 w-10 animate-pulse rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-300"></div>
                <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-border-primary bg-button-info/10 mt-4 rounded-lg border p-4 shadow-sm">
          <div className="relative z-10">
            <span className="text-primary-text text-base font-bold">
              Security Notice
            </span>
            <div className="text-secondary-text mt-1">
              If someone claims to be scanning inventories for JBCL but
              isn&apos;t one of these official bots, they are impersonating us.
              Please report such users to prevent scams.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for official scan bots section
function OfficialBotsContent() {
  const { data, isLoading, error } = useOfficialBotsQuery();

  if (isLoading) {
    return <OfficialBotsSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-primary-text mb-4 text-xl font-bold">
          Official Scan Bots
        </h2>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="text-secondary-text text-center">
            Failed to load official bots. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { bots: sortedBots, avatarData: botAvatarData } = data;

  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Official Scan Bots
      </h2>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="mb-3">
          <p className="text-secondary-text text-sm">
            These are our official inventory scanning bots. Only these accounts
            are authorized to scan inventories on our behalf.
          </p>
        </div>
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {sortedBots.map((bot) => {
            const botId = String(bot.userId);
            const displayName =
              bot.displayName || bot.username || `Bot ${botId}`;
            const username = bot.username || botId;

            // Get bot avatar data
            const botAvatar =
              botAvatarData && typeof botAvatarData === "object"
                ? Object.values(botAvatarData).find(
                    (
                      avatar,
                    ): avatar is { targetId?: number; imageUrl?: string } =>
                      typeof avatar === "object" &&
                      avatar !== null &&
                      "targetId" in avatar &&
                      avatar.targetId?.toString() === botId,
                  )
                : null;

            const avatarUrl = botAvatar?.imageUrl || null;

            return (
              <div
                key={botId}
                className="border-border-primary bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-status-success text-form-button-text flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    <Icon
                      icon="ri:verified-badge-fill"
                      className="h-4 w-4"
                      inline={true}
                    />
                  </div>

                  {/* Bot Avatar */}
                  <div className="bg-tertiary-bg h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${displayName}'s avatar`}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement("div");
                            fallback.className =
                              "flex h-full w-full items-center justify-center";
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <DefaultAvatar />
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <a
                        href={`https://www.roblox.com/users/${botId}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-text hover:text-link-hover font-medium break-words transition-colors"
                      >
                        {displayName}
                      </a>
                      <div className="text-secondary-text text-sm break-words">
                        @{username}
                      </div>
                    </div>
                    <CopyButton text={botId} className="mt-1 flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-border-primary bg-button-info/10 mt-4 rounded-lg border p-4 shadow-sm">
          <div className="relative z-10">
            <span className="text-primary-text text-base font-bold">
              Security Notice
            </span>
            <div className="text-secondary-text mt-1">
              If someone claims to be scanning inventories for JBCL but
              isn&apos;t one of these official bots, they are impersonating us.
              Please report such users to prevent scams.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OfficialBotsSection() {
  return <OfficialBotsContent />;
}
