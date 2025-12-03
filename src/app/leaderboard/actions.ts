"use server";

import { fetchRobloxUsersBatchLeaderboard } from "@/utils/api";

export async function fetchLeaderboardUserData(userIds: string[]) {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        userData: {},
        avatarData: {},
      };
    }

    // Fetch user data (avatars are now handled client-side with direct URLs)
    const userDataResult = await fetchRobloxUsersBatchLeaderboard(userIds);

    return {
      userData: userDataResult || {},
      avatarData: {}, // Avatars now use direct URLs client-side
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
