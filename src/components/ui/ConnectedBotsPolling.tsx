"use client";

import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "./tabs";

export default function ConnectedBotsPolling() {
  "use memo";
  const [botFilter, setBotFilter] = useState<"all" | "main" | "trade">("all");
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

  // Show all bots and sort by most recent heartbeat first
  const allBots = (() => {
    if (mergedBots.length === 0) return [];

    return [...mergedBots].sort((a, b) => {
      // Sort by most recent heartbeat (descending)
      return b.last_heartbeat - a.last_heartbeat;
    });
  })();

  const filteredBots = allBots.filter((bot) => {
    if (botFilter === "main") return bot.method === 2;
    if (botFilter === "trade") return bot.method === 1;
    return true;
  });
  const tradeWorldBotsCount = allBots.filter((bot) => bot.method === 1).length;
  const mainGameBotsCount = allBots.filter((bot) => bot.method === 2).length;

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
        <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
          <div className="mb-4 space-y-2">
            <div className="bg-button-secondary h-4 w-32 animate-pulse rounded"></div>
            <div className="bg-button-secondary h-4 w-40 animate-pulse rounded"></div>
            <div className="bg-button-secondary h-4 w-48 animate-pulse rounded"></div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border-card bg-tertiary-bg rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-button-secondary h-8 w-8 animate-pulse rounded-full"></div>
                  <div className="space-y-1">
                    <div className="bg-button-secondary h-4 w-32 animate-pulse rounded"></div>
                    <div className="bg-button-secondary h-3 w-20 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            ))}
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
        <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
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
      <div className="mb-0 flex items-center gap-3">
        <h2 className="text-secondary-text text-xl font-bold">
          Connected Bots
        </h2>
        <div className="flex items-center gap-2">
          <Icon icon="fluent:live-24-filled" className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium tracking-wide text-red-500 uppercase">
            LIVE
          </span>
        </div>
      </div>
      <div className="text-secondary-text mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span>
          <span className="font-semibold">
            {allBots.length.toLocaleString()}
          </span>{" "}
          bots
        </span>
        <span className="text-tertiary-text" aria-hidden="true">
          |
        </span>
        <span>
          <span className="font-semibold">
            {mainGameBotsCount.toLocaleString()}
          </span>{" "}
          main game bots
        </span>
        <span className="text-tertiary-text" aria-hidden="true">
          |
        </span>
        <span>
          <span className="font-semibold">
            {tradeWorldBotsCount.toLocaleString()}
          </span>{" "}
          trade world bots
        </span>
      </div>
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        {isLoading && !botsData ? (
          <div className="space-y-2">
            <div className="mb-4 space-y-2">
              <div className="bg-button-secondary h-4 w-32 animate-pulse rounded"></div>
              <div className="bg-button-secondary h-4 w-40 animate-pulse rounded"></div>
              <div className="bg-button-secondary h-4 w-48 animate-pulse rounded"></div>
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="border-border-card bg-tertiary-bg rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-button-secondary h-8 w-8 animate-pulse rounded-full"></div>
                    <div className="space-y-1">
                      <div className="bg-button-secondary h-4 w-32 animate-pulse rounded"></div>
                      <div className="bg-button-secondary h-3 w-20 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <div className="text-secondary-text text-sm">
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
                      <div className="border-border-card bg-tertiary-bg flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border">
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
                            )
                          </span>
                        );
                      }
                      return null;
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

            <div className="mb-3">
              <Tabs
                value={botFilter}
                onValueChange={(v) =>
                  setBotFilter(v as "all" | "main" | "trade")
                }
              >
                <TabsList className="h-9 w-full" fullWidth>
                  <TabsTrigger
                    value="all"
                    className="h-8 px-3 text-xs"
                    fullWidth
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="main"
                    className="h-8 px-3 text-xs"
                    fullWidth
                  >
                    Main Game
                  </TabsTrigger>
                  <TabsTrigger
                    value="trade"
                    className="h-8 px-3 text-xs"
                    fullWidth
                  >
                    Trade World
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto">
              {filteredBots.length > 0 ? (
                filteredBots.map((bot: ConnectedBot) => (
                  <BotStatusCard
                    key={bot.id}
                    bot={bot}
                    usersData={botRobloxData?.usersData || null}
                  />
                ))
              ) : (
                <div className="text-secondary-text rounded-lg border border-dashed p-3 text-sm">
                  No bots active in this mode.
                </div>
              )}
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
  const botUsername = userData?.name || bot.id;

  const relativeTime = useOptimizedRealTimeRelativeDate(
    bot.last_heartbeat,
    `bot-${bot.id}-heartbeat`,
  );

  const fullDate = formatCustomDate(bot.last_heartbeat);

  // Generate avatar URL directly
  const avatarUrl = `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${bot.id}/avatar-headshot`;

  // Determine method text
  let methodText = "";
  if (bot.method === 1) methodText = "Trade World";
  else if (bot.method === 2) methodText = "Main Game";
  const trackerUrl = bot.current_job
    ? `https://tracker.jailbreakchangelogs.xyz/?jobid=${encodeURIComponent(bot.current_job)}&utm_source=website&utm_campaign=Connected_Bots&utm_term=${encodeURIComponent(botUsername)}`
    : null;
  const canJoinServer = bot.method === 2 && Boolean(trackerUrl);

  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <div
          className="bg-tertiary-bg flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
          style={{ borderColor: "var(--color-status-success-vibrant)" }}
        >
          <Image
            src={avatarUrl}
            alt={`${displayName} avatar`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector("svg")) {
                const fallback = document.createElement("div");
                fallback.className =
                  "flex h-full w-full items-center justify-center";
                fallback.innerHTML = `<svg class="h-6 w-6 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm leading-6">
            <a
              href={`https://www.roblox.com/users/${bot.id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text hover:text-link-hover font-bold text-nowrap transition-colors"
            >
              {displayName}
            </a>
            {methodText && (
              <>
                <span className="text-secondary-text">|</span>
                <span className="text-primary-text">{methodText}</span>
              </>
            )}
          </div>

          <div className="space-y-0.5">
            <div
              className="text-xs font-medium"
              style={{ color: "var(--color-status-success-vibrant)" }}
            >
              Online
            </div>
            {bot.current_job && (
              <div className="text-secondary-text text-xs">
                <span className="font-semibold">Last Server:</span>{" "}
                {canJoinServer && trackerUrl ? (
                  <a
                    href={trackerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover text-xs font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    Join Server
                    <Icon
                      icon="material-symbols:open-in-new-rounded"
                      className="inline-block h-3.5 w-3.5 align-text-bottom"
                    />
                  </a>
                ) : (
                  <span className="font-mono text-xs">{bot.current_job}</span>
                )}
              </div>
            )}

            <div className="text-secondary-text text-xs">
              <span className="font-semibold">Last User Updated:</span>{" "}
              {fullDate} ({relativeTime})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
