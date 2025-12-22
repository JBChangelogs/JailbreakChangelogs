"use server";

import { fetchChangelog, fetchItemById, BASE_API_URL } from "@/utils/api";

async function fetchSeason(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/get?season=${id}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER ACTION] Error fetching season:", err);
    return null;
  }
}

export async function fetchFavoritesData(userId: string) {
  try {
    const response = await fetch(
      `${BASE_API_URL}/favorites/get?user=${userId}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        // No favorites found - this is not an error
        return [];
      }
      throw new Error(`Failed to fetch favorites: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[SERVER ACTION] Failed to fetch favorites:", error);
    return [];
  }
}

export async function fetchFavoriteItemDetails(
  favorites: Array<{ item_id: string }>,
) {
  try {
    if (!favorites || favorites.length === 0) {
      return {};
    }

    // Fetch item details for each favorite
    const itemDetailsPromises = favorites.map(async (favorite) => {
      try {
        const isSubItem = favorite.item_id.includes("-");

        if (isSubItem) {
          // For sub-items, use the sub-items endpoint
          const [parentId] = favorite.item_id.split("-");
          const response = await fetch(
            `${BASE_API_URL}/items/get/sub?parent_id=${parentId}`,
          );
          if (response.ok) {
            const itemDetails = await response.json();
            return { [favorite.item_id]: itemDetails };
          }
        } else {
          // For regular items, use the helper function
          const itemDetails = await fetchItemById(favorite.item_id);
          if (itemDetails) {
            return { [favorite.item_id]: itemDetails };
          }
        }
        return { [favorite.item_id]: null };
      } catch (err) {
        console.error(
          "[SERVER ACTION] Error fetching item details for %s:",
          favorite.item_id,
          err,
        );
        return { [favorite.item_id]: null };
      }
    });

    const itemDetailsArray = await Promise.all(itemDetailsPromises);

    // Merge all item details into a single object
    const itemDetailsMap: Record<string, unknown> = {};
    itemDetailsArray.forEach((details) => {
      Object.assign(itemDetailsMap, details);
    });

    return itemDetailsMap;
  } catch (error) {
    console.error(
      "[SERVER ACTION] Failed to fetch favorite item details:",
      error,
    );
    return {};
  }
}

export async function fetchCommentDetails(
  comments: Array<{
    item_type: string;
    item_id: number;
  }>,
) {
  try {
    // Group comments by type to batch fetch
    const changelogIds = [
      ...new Set(
        comments
          .filter((c) => c.item_type.toLowerCase() === "changelog")
          .map((c) => c.item_id.toString()),
      ),
    ];

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

    // Batch fetch changelogs, items, and seasons (trades don't need details)
    const [changelogs, items, seasons] = await Promise.all([
      Promise.all(
        changelogIds.map((id) => fetchChangelog(id).catch(() => null)),
      ),
      Promise.all(itemIds.map((id) => fetchItemById(id))),
      Promise.all(seasonIds.map((id) => fetchSeason(id))),
    ]);

    // Create lookup maps
    const changelogMap: Record<string, unknown> = {};
    const itemMap: Record<string, unknown> = {};
    const seasonMap: Record<string, unknown> = {};

    changelogIds.forEach((id, index) => {
      if (changelogs[index]) {
        changelogMap[id] = changelogs[index];
      }
    });

    itemIds.forEach((id, index) => {
      if (items[index]) {
        itemMap[id] = items[index];
      }
    });

    seasonIds.forEach((id, index) => {
      if (seasons[index]) {
        seasonMap[id] = seasons[index];
      }
    });

    return {
      changelogs: changelogMap,
      items: itemMap,
      seasons: seasonMap,
      trades: {}, // Empty since we don't need trade details
      inventories: {}, // Empty since we don't need inventory details for comments
    };
  } catch (error) {
    console.error("[SERVER ACTION] Failed to fetch comment details:", error);
    return {
      changelogs: {},
      items: {},
      seasons: {},
      trades: {},
      inventories: {},
    };
  }
}
