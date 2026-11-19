import { fetchUserByRobloxId } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import type { UserConnectionData } from "./types";

const log = createLogger("INVENTORY");

export async function fetchUserConnection(
  robloxId: string,
): Promise<UserConnectionData | null> {
  try {
    return await fetchUserByRobloxId(robloxId);
  } catch (error) {
    if (!(error instanceof Error && error.message.startsWith("BANNED_USER:")))
      log.error("Failed to fetch user connection data", error);
    return null;
  }
}
