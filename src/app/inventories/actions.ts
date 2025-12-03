"use server";

import { fetchRobloxUsersBatch } from "@/utils/api";

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
