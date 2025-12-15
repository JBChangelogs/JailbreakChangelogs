"use client";

import { useBotsPollingQuery } from "@/hooks/useBotsPollingQuery";
import {
  useRobloxBotsDataQuery,
  useRobloxUserDataQuery,
} from "@/hooks/useRobloxDataQuery";
import { type ConnectedBot } from "@/utils/api";
import { type RobloxUser } from "@/types";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { formatCustomDate } from "@/utils/timestamp";
import Image from "next/image";
import Link from "next/link";
import RetryErrorDisplay from "./RetryErrorDisplay";
import { Icon } from "@iconify/react";

export default function ConnectedBotsPolling() {
  "use memo";
  const {
    data: pollingData,
    error: pollingError,
    isLoading: isPollingLoading,
    failureCount,
  } = useBotsPollingQuery(30000);

  const botsData = pollingData?.botsData;
  const queueInfo = pollingData?.queueInfo;

  // Only show bots from recent heartbeats
  const mergedBots = botsData?.recent_heartbeats || [];

  // Get bot IDs for fetching Roblox data
  const botIds = (() => {
    if (mergedBots.length === 0) return null;
    return mergedBots.map((bot) => bot.id).sort();
  })();

  // Fetch Roblox data for bots (cached)
  const { data: botRobloxData, isLoading: isBotDataLoading } =
    useRobloxBotsDataQuery(botIds);

  // Get last processed user ID
  const lastProcessedUserId = queueInfo?.last_dequeue?.user_id || null;

  // Fetch Roblox data for last processed user (cached)
  const { data: lastProcessedRobloxData } =
    useRobloxUserDataQuery(lastProcessedUserId);

  const lastScannedRelativeTime = useOptimizedRealTimeRelativeDate(
    queueInfo?.last_dequeue?.data?.last_updated || 0,
    "last-scanned",
  );

  // Show all bots and sort by most recent heartbeat first
  const allBots = (() => {
    if (mergedBots.length === 0) return [];

    return [...mergedBots].sort((a, b) => {
      // Sort by most recent heartbeat (descending)
      return b.last_heartbeat - a.last_heartbeat;
    });
  })();

  const error = pollingError?.message || null;
  const isLoading = isPollingLoading || isBotDataLoading;
  const pollingStopped = failureCount >= 3;

  if (error) {
    return (
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-secondary-text text-xl font-bold">
            Connected Bots
          </h2>
          <div className="flex items-center gap-2">
            <Icon
              icon="fluent:live-off-24-filled"
              className="text-status-neutral h-4 w-4"
            />
            <span className="text-status-neutral text-xs font-medium tracking-wide uppercase">
              OFFLINE
            </span>
          </div>
        </div>
        <RetryErrorDisplay
          error={error}
          retryCount={failureCount}
          maxRetries={3}
          retryDelay={5}
        />
      </div>
    );
  }

  if (isLoading && !botsData) {
    return (
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-secondary-text text-xl font-bold">
            Connected Bots
          </h2>
          <div className="flex items-center gap-2">
            <Icon
              icon="fluent:live-off-24-filled"
              className="text-warning h-4 w-4"
            />
            <span className="text-warning text-xs font-medium tracking-wide uppercase">
              CONNECTING
            </span>
          </div>
        </div>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="py-8 text-center">
            <div className="text-secondary-text mb-2 text-lg font-medium">
              Loading bots...
            </div>
            <div className="text-tertiary-text text-sm">Fetching bot data</div>
          </div>
        </div>
      </div>
    );
  }

  if (allBots.length === 0) {
    return (
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-secondary-text text-xl font-bold">
            Connected Bots
          </h2>
          <div className="flex items-center gap-2">
            <Icon
              icon="fluent:live-off-24-filled"
              className="text-status-neutral h-4 w-4"
            />
            <span className="text-status-neutral text-xs font-medium tracking-wide uppercase">
              OFFLINE
            </span>
          </div>
        </div>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="py-8 text-center">
            <div className="text-secondary-text mb-2 text-lg font-medium">
              {pollingStopped ? "Bots offline" : "No bots active"}
            </div>
            <div className="text-tertiary-text text-sm">
              {pollingStopped
                ? "No inventory scanning bots have been active for 2+ minutes. Please check back in a bit."
                : "No inventory scanning bots have been active in the last 30 seconds"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-secondary-text text-xl font-bold">
          Connected Bots
        </h2>
        <div className="flex items-center gap-2">
          <Icon icon="fluent:live-24-filled" className="text-red-500 h-4 w-4" />
          <span className="text-red-500 text-xs font-medium tracking-wide uppercase">
            LIVE
          </span>
        </div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        {isLoading && !botsData ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
              <span className="text-sm text-blue-400">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {queueInfo && (
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-secondary-text">Queue Length:</span>
                  <span className="text-primary-text font-bold">
                    {queueInfo.queue_length.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary-text">Worker Count:</span>
                  <span className="text-primary-text font-bold">
                    {queueInfo.worker_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary-text">Current Delay:</span>
                  <span className="text-primary-text font-bold">
                    {queueInfo.current_delay.toFixed(2)}s
                  </span>
                </div>
                {queueInfo.processed_counter && queueInfo.running_since && (
                  <div className="text-sm text-secondary-text">
                    <span className="text-primary-text font-bold">
                      {queueInfo.processed_counter.total.toLocaleString()}
                    </span>{" "}
                    users scanned since startup (
                    {formatCustomDate(queueInfo.running_since * 1000)})
                  </div>
                )}
                {queueInfo.last_dequeue ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-secondary-text">Last Updated:</span>
                      <div className="bg-tertiary-bg flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${queueInfo.last_dequeue!.user_id}/avatar-headshot`}
                          alt="Last processed user avatar"
                          width={24}
                          height={24}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector("svg")) {
                              const fallback = document.createElement("div");
                              fallback.className =
                                "flex h-full w-full items-center justify-center";
                              fallback.innerHTML = `<svg class="h-4 w-4 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                      <Link
                        href={`/inventories/${queueInfo.last_dequeue!.user_id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link-hover font-bold transition-colors"
                      >
                        {lastProcessedRobloxData?.usersData?.[
                          queueInfo.last_dequeue!.user_id
                        ]?.name ||
                          lastProcessedRobloxData?.usersData?.[
                            queueInfo.last_dequeue!.user_id
                          ]?.displayName ||
                          queueInfo.last_dequeue!.user_id}
                      </Link>
                    </div>
                    {(() => {
                      const botId = queueInfo.last_dequeue!.data.bot_id;
                      const botUserData = botRobloxData?.usersData?.[botId];
                      if (botUserData) {
                        const botDisplayName =
                          botUserData.name ||
                          botUserData.displayName ||
                          `Bot ${botId}`;
                        return (
                          <span className="text-secondary-text text-xs">
                            (scanned by{" "}
                            <a
                              href={`https://www.roblox.com/users/${botId}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-text hover:text-link-hover transition-colors"
                            >
                              {botDisplayName}
                            </a>
                            ) • {lastScannedRelativeTime}
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs text-gray-400">
                          • {lastScannedRelativeTime}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-secondary-text">Last Updated:</span>
                    <span className="text-primary-text">
                      No recent activity
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="max-h-60 space-y-2 overflow-y-auto">
              {allBots.map((bot: ConnectedBot) => (
                <BotStatusCard
                  key={bot.id}
                  bot={bot}
                  usersData={botRobloxData?.usersData || null}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BotStatusCard({
  bot,
  usersData,
}: {
  bot: ConnectedBot;
  usersData: Record<string, RobloxUser> | null;
}) {
  const userData = usersData?.[bot.id];
  const displayName =
    userData?.displayName || userData?.name || `Bot ${bot.id}`;
  const username = userData?.name || bot.id;

  const relativeTime = useOptimizedRealTimeRelativeDate(
    bot.last_heartbeat,
    `bot-${bot.id}-heartbeat`,
  );

  const fullDate = formatCustomDate(bot.last_heartbeat);

  // Generate avatar URL directly
  const avatarUrl = `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${bot.id}/avatar-headshot`;

  return (
    <div className="border-border-primary bg-primary-bg rounded-lg border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-tertiary-bg flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
            <Image
              src={avatarUrl}
              alt={`${displayName} avatar`}
              width={32}
              height={32}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector("svg")) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "flex h-full w-full items-center justify-center";
                  fallback.innerHTML = `<svg class="h-5 w-5 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          <div>
            <a
              href={`https://www.roblox.com/users/${bot.id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text hover:text-link-hover text-sm font-medium transition-colors"
            >
              {displayName}
            </a>
            <div className="text-secondary-text text-xs">@{username}</div>
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-secondary-text mb-1 text-xs">
            Last updated: {fullDate} ({relativeTime})
          </div>
          {bot.current_job && (
            <div className="text-status-info text-xs">
              <div>Latest Job ID</div>
              <div className="font-mono text-xs break-all">
                {bot.current_job}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
