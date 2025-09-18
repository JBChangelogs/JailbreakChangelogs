import {
  fetchConnectedBots,
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchQueueInfo,
} from "@/utils/api";
import { type RobloxUser, type RobloxAvatar } from "@/types";
import ConnectedBotsClient from "@/components/UI/ConnectedBotsClient";

export default async function ConnectedBotsSection() {
  const [botsData, queueInfo] = await Promise.all([
    fetchConnectedBots(),
    fetchQueueInfo(),
  ]);

  if (!botsData) {
    return null;
  }

  // Filter recent heartbeats to only show bots active in last 30 seconds
  const now = Math.floor(Date.now() / 1000);
  const thirtySecondsAgo = now - 30;

  const activeBots = botsData.recent_heartbeats.filter(
    (bot) => bot.last_heartbeat >= thirtySecondsAgo,
  );

  const totalCount = activeBots.length;

  // If no bots are active, show a message
  if (totalCount === 0) {
    return (
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-300">Active Bots</h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              OFFLINE
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="py-8 text-center">
            <div className="mb-2 text-lg font-medium text-gray-400">
              No bots active
            </div>
            <div className="text-sm text-gray-500">
              No inventory scanning bots have been active in the last 30 seconds
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch Roblox user data and avatars for active bots and last processed user
  let usersData: Record<string, RobloxUser> | null = null;
  let avatarsData: Record<string, RobloxAvatar> = {};

  const userIdsToFetch = [...activeBots.map((bot) => bot.id)];

  // Add last processed user ID if available
  if (queueInfo?.last_dequeue?.user_id) {
    userIdsToFetch.push(queueInfo.last_dequeue.user_id);
  }

  if (userIdsToFetch.length > 0) {
    const [fetchedUsersData, fetchedAvatarsData] = await Promise.all([
      fetchRobloxUsersBatch(userIdsToFetch).catch((err) => {
        console.error("Failed to fetch user data:", err);
        return null;
      }),
      fetchRobloxAvatars(userIdsToFetch).catch((err) => {
        console.error("Failed to fetch avatar data:", err);
        return {};
      }),
    ]);

    // Handle both return types from fetchRobloxUsersBatch
    usersData =
      fetchedUsersData && "data" in fetchedUsersData ? null : fetchedUsersData;
    avatarsData = fetchedAvatarsData || {};
  }

  return (
    <ConnectedBotsClient
      activeBots={activeBots}
      usersData={usersData}
      avatarsData={avatarsData}
      queueInfo={queueInfo}
    />
  );
}
