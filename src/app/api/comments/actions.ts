"use server";

import { fetchComments } from "@/utils/api";

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
