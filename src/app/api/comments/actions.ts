"use server";

import { fetchComments } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

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
    log.error("[SERVER ACTION] Failed to refresh comments:", error);
    return {
      success: false,
      error: "Failed to fetch comments",
    };
  }
}
