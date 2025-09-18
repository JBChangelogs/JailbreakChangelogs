"use server";

import {
  fetchConnectedBots,
  fetchQueueInfo,
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
} from "@/utils/api";

export async function pollBotsData() {
  try {
    const [botsData, queueInfo] = await Promise.all([
      fetchConnectedBots(),
      fetchQueueInfo(),
    ]);

    return {
      success: true,
      data: {
        botsData,
        queueInfo,
      },
    };
  } catch (error) {
    console.error("Failed to fetch bots data:", error);
    return {
      success: false,
      error: "Failed to fetch bots data",
    };
  }
}

export async function fetchRobloxDataForBots(botIds: string[]) {
  try {
    if (botIds.length === 0) {
      return {
        success: true,
        data: {
          usersData: null,
          avatarsData: {},
        },
      };
    }

    const [fetchedUsersData, fetchedAvatarsData] = await Promise.all([
      fetchRobloxUsersBatch(botIds).catch(() => null),
      fetchRobloxAvatars(botIds).catch(() => ({})),
    ]);

    const usersData =
      fetchedUsersData && "data" in fetchedUsersData ? null : fetchedUsersData;
    const avatarsData = fetchedAvatarsData || {};

    return {
      success: true,
      data: {
        usersData,
        avatarsData,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Roblox data for bots:", error);
    return {
      success: false,
      error: "Failed to fetch Roblox data for bots",
    };
  }
}

export async function fetchRobloxDataForUser(userId: string) {
  try {
    if (!userId) {
      return {
        success: true,
        data: {
          usersData: null,
          avatarsData: {},
        },
      };
    }

    const [fetchedUsersData, fetchedAvatarsData] = await Promise.all([
      fetchRobloxUsersBatch([userId]).catch(() => null),
      fetchRobloxAvatars([userId]).catch(() => ({})),
    ]);

    const usersData =
      fetchedUsersData && "data" in fetchedUsersData ? null : fetchedUsersData;
    const avatarsData = fetchedAvatarsData || {};

    return {
      success: true,
      data: {
        usersData,
        avatarsData,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Roblox data for user:", error);
    return {
      success: false,
      error: "Failed to fetch Roblox data for user",
    };
  }
}

export async function pollConnectedBots() {
  try {
    const botsData = await fetchConnectedBots();

    return {
      success: true,
      data: botsData,
    };
  } catch (error) {
    console.error("[SERVER ACTION] Failed to poll connected bots:", error);
    return {
      success: false,
      error: "Failed to fetch connected bots",
    };
  }
}

export async function pollQueueInfo() {
  try {
    const queueInfo = await fetchQueueInfo();

    return {
      success: true,
      data: queueInfo,
    };
  } catch (error) {
    console.error("[SERVER ACTION] Failed to poll queue info:", error);
    return {
      success: false,
      error: "Failed to fetch queue info",
    };
  }
}
