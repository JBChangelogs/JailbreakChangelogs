"use server";

import {
  fetchRobloxUsersBatchLeaderboard,
  fetchRobloxAvatars,
} from "@/utils/api/api";

export async function fetchLeaderboardUserData(userIds: string[]) {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        userData: {},
        avatarData: {},
      };
    }

    // Fetch both user data and avatars in parallel
    const [userDataResult, avatarData] = await Promise.all([
      fetchRobloxUsersBatchLeaderboard(userIds),
      fetchRobloxAvatars(userIds),
    ]);

    // Process avatar data to extract imageUrl strings
    const processedAvatarData: Record<string, string> = {};
    if (avatarData && typeof avatarData === "object") {
      Object.values(avatarData).forEach((avatar) => {
        const avatarObj = avatar as {
          targetId?: number;
          imageUrl?: string;
        };
        if (avatarObj && avatarObj.targetId && avatarObj.imageUrl) {
          processedAvatarData[avatarObj.targetId.toString()] =
            avatarObj.imageUrl;
        }
      });
    }

    return {
      userData: userDataResult || {},
      avatarData: processedAvatarData,
    };
  } catch (error) {
    console.error(
      "[SERVER ACTION] Failed to fetch leaderboard user data:",
      error,
    );
    return {
      userData: {},
      avatarData: {},
    };
  }
}
