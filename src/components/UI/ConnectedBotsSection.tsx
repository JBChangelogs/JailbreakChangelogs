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

  const allBots = botsData.recent_heartbeats;
  const totalCount = allBots.length;

  if (totalCount === 0) {
    return (
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-300">Connected Bots</h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              OFFLINE
            </span>
          </div>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <div className="py-8 text-center">
            <div className="mb-2 text-lg font-medium text-gray-400">
              No bots available
            </div>
            <div className="text-sm text-gray-500">
              No inventory scanning bots are currently available
            </div>
          </div>
        </div>
      </div>
    );
  }

  let usersData: Record<string, RobloxUser> | null = null;
  let avatarsData: Record<string, RobloxAvatar> = {};

  const userIdsToFetch = [...allBots.map((bot) => bot.id)];

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

    usersData =
      fetchedUsersData && "data" in fetchedUsersData ? null : fetchedUsersData;
    avatarsData = fetchedAvatarsData || {};
  }

  return (
    <ConnectedBotsClient
      activeBots={allBots}
      usersData={usersData}
      avatarsData={avatarsData}
      queueInfo={queueInfo}
    />
  );
}
