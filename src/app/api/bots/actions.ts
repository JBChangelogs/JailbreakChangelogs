"use server";

import {
  fetchConnectedBots,
  fetchQueueInfo,
  fetchRobloxUsersBatch,
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
        },
      };
    }

    const fetchedUsersData = await fetchRobloxUsersBatch(botIds).catch(
      () => null,
    );

    const usersData =
      fetchedUsersData && "data" in fetchedUsersData ? null : fetchedUsersData;

    return {
      success: true,
      data: {
        usersData,
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
        },
      };
    }

    const fetchedUsersData = await fetchRobloxUsersBatch([userId]).catch(
      () => null,
    );

    const usersData =
      fetchedUsersData && "data" in fetchedUsersData ? null : fetchedUsersData;

    return {
      success: true,
      data: {
        usersData,
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
