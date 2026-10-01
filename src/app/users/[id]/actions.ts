import {
  fetchPartialItems,
  PUBLIC_API_URL,
  type PartialItem,
} from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

async function fetchSeason(id: string) {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/v2/seasons/${id}`);
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
      `/v2/users/${userId}/favorites`,
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
      itemIds.length > 0
        ? fetchPartialItems<PartialItem>(["name", "type"])
        : Promise.resolve([]),
      Promise.all(seasonIds.map((id) => fetchSeason(id))),
    ]);

    const itemMap: Record<string, unknown> = {};
    const seasonMap: Record<string, unknown> = {};

    const requestedItemIds = new Set(itemIds);
    items.forEach((item) => {
      if (requestedItemIds.has(String(item.id)))
        itemMap[String(item.id)] = item;
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
