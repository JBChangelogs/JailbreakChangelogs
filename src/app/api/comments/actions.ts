"use server";

import { fetchComments, fetchUsersBatch } from "@/utils/api";

export async function refreshComments(
  type: string,
  id: string,
  itemType?: string,
) {
  try {
    const commentsData = await fetchComments(type, id, itemType);

    return {
      success: true,
      data: commentsData,
    };
  } catch (error) {
    console.error("[SERVER ACTION] Failed to refresh comments:", error);
    return {
      success: false,
      error: "Failed to fetch comments",
    };
  }
}

export async function fetchUsersBatchAction(userIds: string[]) {
  try {
    const userMap = await fetchUsersBatch(userIds);

    return {
      success: true,
      data: userMap,
    };
  } catch (error) {
    console.error("[SERVER ACTION] Failed to fetch users batch:", error);
    return {
      success: false,
      error: "Failed to fetch user data",
    };
  }
}
