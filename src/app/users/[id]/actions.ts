import { PUBLIC_API_URL } from "@/utils/api";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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
    const response = await fetchWithRetry(
      `${PUBLIC_API_URL}/favorites/get?user=${userId}`,
      undefined,
      { maxRetries: 3, initialDelayMs: 800, timeoutMs: 10000 },
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Failed to fetch favorites: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
}

export async function fetchFavoriteItemDetails(
  favorites: Array<{ item_id: string }>,
) {
  try {
    if (!favorites || favorites.length === 0) return {};

    const itemDetailsPromises = favorites.map(async (favorite) => {
      try {
        const itemDetails = await fetchItemById(favorite.item_id);
        return { [favorite.item_id]: itemDetails ?? null };
      } catch {
        return { [favorite.item_id]: null };
      }
    });

    const itemDetailsArray = await Promise.all(itemDetailsPromises);
    const itemDetailsMap: Record<string, unknown> = {};
    itemDetailsArray.forEach((details) =>
      Object.assign(itemDetailsMap, details),
    );
    return itemDetailsMap;
  } catch (error) {
    console.error("Failed to fetch favorite item details:", error);
    return {};
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
    console.error("Failed to fetch comment details:", error);
    return {
      changelogs: {},
      items: {},
      seasons: {},
      trades: {},
      inventories: {},
    };
  }
}
