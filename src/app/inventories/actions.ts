"use server";

import { fetchRobloxUsersBatch, fetchRobloxAvatars } from "@/utils/api/api";

export async function fetchMissingRobloxData(userIds: string[]) {
  try {
    const numericUserIds = userIds.filter((id) => /^\d+$/.test(id));

    if (numericUserIds.length === 0) {
      return { userData: {}, avatarData: {} };
    }

    // Only fetch usernames since avatars aren't displayed in inventory cards
    // (avatars are only needed for the main user profile, which is fetched separately)
    const userData = await fetchRobloxUsersBatch(numericUserIds);

    return {
      userData: userData || {},
      avatarData: {}, // No avatar data needed for original owners
    };
  } catch (error) {
    console.error(
      "[SERVER ACTION] Failed to fetch missing Roblox data:",
      error,
    );
    return { userData: {}, avatarData: {} };
  }
}

export async function fetchOriginalOwnerAvatars(userIds: string[]) {
  try {
    const numericUserIds = userIds.filter((id) => /^\d+$/.test(id));

    if (numericUserIds.length === 0) {
      return {};
    }

    // Always fetch avatars for original owners (these are typically small batches)
    const avatarData = await fetchRobloxAvatars(numericUserIds);

    // Process avatar data to extract imageUrl strings
    const processedAvatarData: Record<string, string> = {};
    if (avatarData && typeof avatarData === "object") {
      Object.values(avatarData).forEach((avatar) => {
        const avatarData = avatar as {
          targetId: number;
          state: string;
          imageUrl?: string;
          version: string;
        };
        if (
          avatarData &&
          avatarData.targetId &&
          avatarData.state === "Completed" &&
          avatarData.imageUrl
        ) {
          // Only add completed avatars to the data
          processedAvatarData[avatarData.targetId.toString()] =
            avatarData.imageUrl;
        }
        // For blocked avatars, don't add them to the data so components can use their own fallback
      });
    }

    return processedAvatarData;
  } catch (error) {
    console.error(
      "[SERVER ACTION] Failed to fetch original owner avatars:",
      error,
    );
    return {};
  }
}
