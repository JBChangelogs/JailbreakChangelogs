"use server";

import { fetchOnlineUsers } from "@/utils/api";

export async function pollOnlineUsers() {
  try {
    const onlineUsers = await fetchOnlineUsers();

    return {
      success: true,
      data: onlineUsers,
    };
  } catch (error) {
    console.error("[SERVER ACTION] Failed to poll online users:", error);
    return {
      success: false,
      error: "Failed to fetch online users",
    };
  }
}
