import { PUBLIC_API_URL } from "@/utils/api/api";
import { fetchWithRetry } from "@/utils/api/fetchWithRetry";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

async function fetchSeason(id: string) {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/seasons/get?season=${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchItemById(id: string) {
  try {
    const response = await fetchWithRetry(
      `${PUBLIC_API_URL}/items/get?id=${id}`,
      undefined,
      { maxRetries: 3, initialDelayMs: 800, timeoutMs: 10000 },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchFavoritesData(userId: string) {
  try {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL,
      `/favorites/user/${userId}`,
    );
    const response = await fetch(url, { headers, credentials: "include" });

    if (!response.ok) {
      if (response.status === 404) return [];
      const body = await response.json().catch(() => ({}));
      log.error("fetch favorites failed", { status: response.status, body });
      throw new Error(`Failed to fetch favorites: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log.error("Failed to fetch favorites:", error);
    return [];
  }
}

export async function fetchCommentDetails(
  comments: Array<{ item_type: string; item_id: number }>,
) {
  try {
    const itemIds = [
      ...new Set(
        comments
          .filter((c) => {
            const type = c.item_type.toLowerCase();
            return (
              type !== "changelog" &&
              type !== "season" &&
              type !== "trade" &&
              type !== "inventory"
            );
          })
          .map((c) => c.item_id.toString()),
      ),
    ];

    const seasonIds = [
      ...new Set(
        comments
          .filter((c) => c.item_type.toLowerCase() === "season")
          .map((c) => c.item_id.toString()),
      ),
    ];

    const [items, seasons] = await Promise.all([
      Promise.all(itemIds.map((id) => fetchItemById(id))),
      Promise.all(seasonIds.map((id) => fetchSeason(id))),
    ]);

    const itemMap: Record<string, unknown> = {};
    const seasonMap: Record<string, unknown> = {};

    itemIds.forEach((id, index) => {
      if (items[index]) itemMap[id] = items[index];
    });
    seasonIds.forEach((id, index) => {
      if (seasons[index]) seasonMap[id] = seasons[index];
    });

    return {
      changelogs: {},
      items: itemMap,
      seasons: seasonMap,
      trades: {},
      inventories: {},
    };
  } catch (error) {
    log.error("Failed to fetch comment details:", error);
    return {
      changelogs: {},
      items: {},
      seasons: {},
      trades: {},
      inventories: {},
    };
  }
}
