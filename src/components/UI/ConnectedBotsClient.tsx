"use client";

import { type ConnectedBot, type QueueInfo } from "@/utils/api";
import { type RobloxUser, type RobloxAvatar } from "@/types";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { formatCustomDate } from "@/utils/timestamp";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";

interface ConnectedBotsClientProps {
  activeBots: ConnectedBot[];
  usersData: Record<string, RobloxUser> | null;
  avatarsData: Record<string, RobloxAvatar>;
  queueInfo: QueueInfo | null;
}

export default function ConnectedBotsClient({
  activeBots,
  usersData,
  avatarsData,
  queueInfo,
}: ConnectedBotsClientProps) {
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-300">Active Bots</h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
          <span className="text-xs font-medium tracking-wide text-red-400 uppercase">
            LIVE
          </span>
        </div>
      </div>
      <div className="rounded-lg border p-4 shadow-sm">
        {/* Queue Stats */}
        {queueInfo && (
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Queue Length:</span>
              <span className="font-bold text-white">
                {queueInfo.queue_length.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Current Delay:</span>
              <span className="font-bold text-white">
                {queueInfo.current_delay.toFixed(2)}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Last Processed:</span>
              {queueInfo.last_dequeue ? (
                <div className="flex items-center gap-2">
                  {/* Avatar for last processed user */}
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-tertiary-bg">
                    {(() => {
                      const avatarUrl =
                        avatarsData &&
                        Object.values(avatarsData).find(
                          (avatar: RobloxAvatar) =>
                            avatar?.targetId?.toString() ===
                            queueInfo.last_dequeue!.user_id,
                        )?.imageUrl;

                      return avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Last processed user avatar"
                          width={24}
                          height={24}
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
                        <DefaultAvatar />
                      );
                    })()}
                  </div>
                  <a
                    href={`https://www.roblox.com/users/${queueInfo.last_dequeue!.user_id}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-300 transition-colors hover:text-blue-200"
                  >
                    {usersData?.[queueInfo.last_dequeue!.user_id]
                      ?.displayName ||
                      usersData?.[queueInfo.last_dequeue!.user_id]?.name ||
                      queueInfo.last_dequeue!.user_id}
                  </a>
                  <span className="text-gray-400">
                    @
                    {usersData?.[queueInfo.last_dequeue!.user_id]?.name ||
                      queueInfo.last_dequeue!.user_id}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">No recent activity</span>
              )}
            </div>
          </div>
        )}

        {/* Bot List */}
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {activeBots.map((bot: ConnectedBot) => (
            <BotStatusCard
              key={bot.id}
              bot={bot}
              usersData={usersData}
              avatarsData={avatarsData}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BotStatusCard({
  bot,
  usersData,
  avatarsData,
}: {
  bot: ConnectedBot;
  usersData: Record<string, RobloxUser> | null;
  avatarsData: Record<string, RobloxAvatar>;
}) {
  // Find user data for this bot
  const userData = usersData?.[bot.id];
  const displayName =
    userData?.displayName || userData?.name || `Bot ${bot.id}`;
  const username = userData?.name || bot.id;

  // Use real-time relative time hook
  const relativeTime = useOptimizedRealTimeRelativeDate(
    bot.last_heartbeat,
    `bot-${bot.id}-heartbeat`,
  );

  // Format full date
  const fullDate = formatCustomDate(bot.last_heartbeat);

  // Find avatar data for this bot
  const avatarData =
    avatarsData && typeof avatarsData === "object"
      ? Object.values(avatarsData).find(
          (avatar: RobloxAvatar) =>
            typeof avatar === "object" &&
            avatar !== null &&
            "targetId" in avatar &&
            avatar.targetId?.toString() === bot.id,
        )
      : null;

  const avatarUrl = avatarData?.imageUrl || null;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-tertiary-bg">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${displayName} avatar`}
              width={32}
              height={32}
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
            <DefaultAvatar />
          )}
        </div>

        <div>
          <a
            href={`https://www.roblox.com/users/${bot.id}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-300 transition-colors hover:text-blue-200"
          >
            {displayName}
          </a>
          <div className="text-xs text-gray-400">@{username}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="mb-1 text-xs text-gray-400">
          Last updated: {fullDate} ({relativeTime})
        </div>
        {bot.current_job && (
          <div className="text-xs text-blue-400">
            <div>Latest Job ID</div>
            <div className="font-mono text-xs">{bot.current_job}</div>
          </div>
        )}
      </div>
    </div>
  );
}
