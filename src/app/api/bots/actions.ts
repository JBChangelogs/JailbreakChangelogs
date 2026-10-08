"use server";

import {
  fetchConnectedBots,
  fetchQueueInfo,
  fetchRobloxUsersBatch,
} from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

export async function pollBotsData() {
  try {
    const [botsData, queueInfo] = await Promise.all([
      fetchConnectedBots({ includePrivate: false }),
      fetchQueueInfo({ includePrivate: false }),
    ]);

    return {
      success: true,
      data: {
        botsData,
        queueInfo,
      },
    };
  } catch (error) {
    log.error("Failed to fetch bots data:", error);
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
    log.error("Failed to fetch Roblox data for bots:", error);
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
    log.error("Failed to fetch Roblox data for user:", error);
    return {
      success: false,
      error: "Failed to fetch Roblox data for user",
    };
  }
}
