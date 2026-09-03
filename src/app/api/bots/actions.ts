"use server";

import {
  BASE_API_URL,
  fetchConnectedBots,
  fetchQueueInfo,
  fetchRobloxUsersBatch,
} from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { getAuthToken } from "@/utils/api/routeAuth";

const log = createLogger("API");

async function canViewPrivateBotData() {
  const token = await getAuthToken();
  if (!token || !BASE_API_URL) return false;

  try {
    const response = await fetch(
      `${BASE_API_URL}/users/get/token?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return false;

    const user = (await response.json()) as {
      flags?: Array<{ flag?: string | null; enabled?: boolean }>;
    };
    return (
      user.flags?.some(
        (flag) => flag.flag === "is_owner" && flag.enabled !== false,
      ) ?? false
    );
  } catch {
    return false;
  }
}

export async function pollBotsData() {
  try {
    const includePrivate = await canViewPrivateBotData();
    const [botsData, queueInfo] = await Promise.all([
      fetchConnectedBots({ includePrivate }),
      fetchQueueInfo({ includePrivate }),
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

export async function pollConnectedBots() {
  try {
    const includePrivate = await canViewPrivateBotData();
    const botsData = await fetchConnectedBots({ includePrivate });

    return {
      success: true,
      data: botsData,
    };
  } catch (error) {
    log.error("[SERVER ACTION] Failed to poll connected bots:", error);
    return {
      success: false,
      error: "Failed to fetch connected bots",
    };
  }
}

export async function pollQueueInfo() {
  try {
    const includePrivate = await canViewPrivateBotData();
    const queueInfo = await fetchQueueInfo({ includePrivate });

    return {
      success: true,
      data: queueInfo,
    };
  } catch (error) {
    log.error("[SERVER ACTION] Failed to poll queue info:", error);
    return {
      success: false,
      error: "Failed to fetch queue info",
    };
  }
}
