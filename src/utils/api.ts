interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
}

export interface Changelog {
  id: number;
  title: string;
  sections: string;
  image_url: string;
}

export interface Reward {
  id: number;
  season_number: number;
  item: string;
  requirement: string;
  link: string;
  exclusive: string;
  bonus: string;
}

export interface Season {
  season: number;
  title: string;
  description: string;
  is_current: number;
  start_date: number;
  end_date: number;
  rewards: Reward[];
}

import { Item, ItemDetails, RobloxUser } from "@/types";
import { UserData } from "@/types/auth";
import type WebSocket from "ws";

export const BASE_API_URL =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.RAILWAY_ENVIRONMENT_NAME !== "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.RAILWAY_INTERNAL_API_URL;

export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
export const INVENTORY_API_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
export const CREW_LEADERBOARD_BASE_URL =
  process.env.NEXT_PUBLIC_CREW_LEADERBOARD_BASE_URL;
export const INVENTORY_WS_URL = process.env
  .NEXT_PUBLIC_INVENTORY_WS_URL as string;
export const ENABLE_WS_SCAN = process.env.NEXT_PUBLIC_ENABLE_WS_SCAN === "true";
export interface OnlineUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  created_at: string;
  premiumtype: number;
  usernumber: number;
  last_seen: number;
}

export const fetchUsers = async () => {
  const response = await fetch(`${BASE_API_URL}/users/list`, {
    headers: {
      "User-Agent": "JailbreakChangelogs-UserSearch/1.0",
    },
  });
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchUserById(id: string) {
  try {
    const response = await fetch(
      `${BASE_API_URL}/users/get?id=${id}&nocache=true`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
        },
      },
    );
    const data = await response.json();

    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage =
          data.detail || "This user is banned from Jailbreak Changelogs.";
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }

      // Log error response for other types of errors
      console.error("Error response:", {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2),
      });

      if (data.detail) {
        throw new Error(
          `Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`,
        );
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);

    // Re-throw BANNED_USER errors so calling code can handle them
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      throw error;
    }

    return null;
  }
}

export async function fetchUserByIdForOG(id: string) {
  try {
    const fields = [
      "id",
      "username",
      "global_name",
      "usernumber",
      "accent_color",
      "avatar",
      "banner",
      "custom_avatar",
      "custom_banner",
      "settings",
      "premiumtype",
    ].join(",");

    const response = await fetch(
      `${BASE_API_URL}/users/get?id=${id}&fields=${fields}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
        },
      },
    );
    const data = await response.json();

    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage =
          data.detail || "This user is banned from Jailbreak Changelogs.";
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }

      // Log error response for other types of errors
      console.error("Error response:", {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2),
      });

      if (data.detail) {
        throw new Error(
          `Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`,
        );
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching user by ID for OG:", error);

    // Re-throw BANNED_USER errors so calling code can handle them
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      throw error;
    }

    return null;
  }
}

export async function fetchUserByIdForMetadata(id: string) {
  try {
    const fields = ["accent_color", "global_name", "username"].join(",");

    const response = await fetch(
      `${BASE_API_URL}/users/get?id=${id}&fields=${fields}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Metadata/1.0",
        },
      },
    );
    const data = await response.json();

    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage =
          data.detail || "This user is banned from Jailbreak Changelogs.";
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }

      // Log error response for other types of errors
      console.error("Error response:", {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2),
      });

      if (data.detail) {
        throw new Error(
          `Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`,
        );
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching user by ID for metadata:", error);

    // Re-throw BANNED_USER errors so calling code can handle them
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      throw error;
    }

    return null;
  }
}

export async function fetchUserByRobloxId(robloxId: string) {
  try {
    const response = await fetch(
      `${BASE_API_URL}/users/get/roblox?id=${robloxId}&nocache=true`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
        },
      },
    );
    const data = await response.json();

    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage =
          data.detail || "This user is banned from Jailbreak Changelogs.";
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }

      // Log error response for other types of errors (skip 404s as they're expected)
      if (response.status !== 404) {
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(data, null, 2),
        });
      }

      if (data.detail) {
        throw new Error(
          `Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`,
        );
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Only log non-404 errors as 404 means user doesn't exist in our database (expected)
    if (error instanceof Error && !error.message.includes("404")) {
      console.error("Error fetching user by Roblox ID:", error);
    }

    // Re-throw BANNED_USER errors so calling code can handle them
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      throw error;
    }

    return null;
  }
}

export const fetchUsersForList = async () => {
  const fields = [
    "id",
    "username",
    "global_name",
    "avatar",
    "usernumber",
    "accent_color",
    "custom_avatar",
    "settings",
    "premiumtype",
    "created_at",
    "roblox_id",
    "roblox_username",
    "roblox_display_name",
    "roblox_avatar",
    "roblox_join_date",
  ].join(",");

  const response = await fetch(
    `${BASE_API_URL}/users/list?fields=${fields}&nocache=true`,
    {
      headers: {
        "User-Agent": "JailbreakChangelogs-UserSearch/1.0",
      },
    },
  );
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchItems() {
  try {
    const response = await fetch(`${BASE_API_URL}/items/list`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-ItemCatalog/1.0",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch items");
    const data = await response.json();
    return data as Item[];
  } catch {
    console.error("[SERVER] Error fetching items");
    return [];
  }
}

export async function fetchLastUpdated(items: Item[]) {
  try {
    if (!items || items.length === 0) {
      console.log("No items provided for last updated");
      return null;
    }

    // Create an array of all items including sub-items
    const allItems = items.reduce((acc: Item[], item) => {
      acc.push(item);
      if (item.children && Array.isArray(item.children)) {
        item.children.forEach((child) => {
          if (child.data) {
            acc.push({
              ...item,
              last_updated: child.data.last_updated,
              name: child.sub_name,
            });
          }
        });
      }
      return acc;
    }, []);

    // Sort all items by last_updated in descending order and get the most recent
    const mostRecentItem = [...allItems].sort((a, b) => {
      const aTime =
        a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
      const bTime =
        b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
      return bTime - aTime;
    })[0];

    // Return the raw timestamp (in ms)
    const rawTimestamp =
      mostRecentItem.last_updated < 10000000000
        ? mostRecentItem.last_updated * 1000
        : mostRecentItem.last_updated;
    return rawTimestamp;
  } catch (err) {
    console.error("Error getting last updated time:", err);
    return null;
  }
}

export async function fetchItem(
  type: string,
  name: string,
): Promise<ItemDetails | null> {
  try {
    const itemName = decodeURIComponent(name);
    const itemType = decodeURIComponent(type);

    const response = await fetch(
      `${BASE_API_URL}/items/get?name=${encodeURIComponent(itemName)}&type=${encodeURIComponent(itemType)}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-ItemDetails/1.0",
        },
      },
    );

    if (!response.ok) {
      console.log("[SERVER] Item not found:", {
        type: itemType,
        name: itemName,
      });
      return null;
    }

    const data = await response.json();
    return data as ItemDetails;
  } catch (err) {
    console.error("[SERVER] Error fetching item:", err);
    return null;
  }
}

export async function fetchItemById(id: string): Promise<ItemDetails | null> {
  try {
    const response = await fetch(`${BASE_API_URL}/items/get?id=${id}`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-ItemDetails/1.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as ItemDetails;
  } catch (err) {
    console.error("[SERVER] Error fetching item by ID:", err);
    return null;
  }
}

export async function fetchChangelogList(): Promise<Changelog[]> {
  const response = await fetch(`${BASE_API_URL}/changelogs/list`, {
    headers: {
      "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch changelog list");
  return response.json();
}

export async function fetchChangelog(id: string): Promise<Changelog> {
  const response = await fetch(`${BASE_API_URL}/changelogs/get?id=${id}`, {
    headers: {
      "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch changelog");
  return response.json();
}

export async function fetchLatestChangelog(): Promise<Changelog> {
  const response = await fetch(`${BASE_API_URL}/changelogs/latest`, {
    headers: {
      "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch latest changelog");
  return response.json();
}

export async function fetchItemsChangelog(id: string) {
  try {
    const response = await fetch(
      `${BASE_API_URL}/items/changelogs/get?id=${id}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
        },
      },
    );

    if (response.status === 404) {
      console.log(`[SERVER] Items changelog ${id} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch items changelog");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching items changelog:", err);
    return null;
  }
}

export async function fetchItemChanges(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/item/changes?id=${id}`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
      },
    });
    if (response.status === 404) {
      return [] as unknown[];
    }
    if (!response.ok) {
      throw new Error("Failed to fetch item changes");
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching item changes:", err);
    return [] as unknown[];
  }
}

export async function fetchTradeAds() {
  try {
    const response = await fetch(`${BASE_API_URL}/trades/list?nocache=true`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Trading/1.0",
      },
    });

    if (response.status === 404) {
      // 404 means no trade ads found (all expired)
      return [];
    }

    if (!response.ok) {
      throw new Error("Failed to fetch trade ads");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching trade ads:", err);
    return [];
  }
}

export async function fetchTradeAd(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/trades/get?id=${id}`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Trading/1.0",
      },
    });

    if (response.status === 404) {
      console.log(`[SERVER] Trade ad ${id} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch trade ad");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching trade ad:", err);
    return null;
  }
}

export async function fetchUsersBatch(userIds: string[]) {
  try {
    if (userIds.length === 0) {
      return {};
    }

    const response = await fetch(
      `${BASE_API_URL}/users/get/batch?ids=${userIds.join(",")}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-UserBatch/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch users batch");
    }

    const userDataArray = await response.json();
    const userMap = userDataArray.reduce(
      (acc: Record<string, UserData>, user: UserData) => {
        acc[user.id] = user;
        return acc;
      },
      {},
    );

    return userMap;
  } catch (err) {
    console.error("[SERVER] Error fetching users batch:", err);
    return {};
  }
}

export async function fetchDupes() {
  try {
    const response = await fetch(`${BASE_API_URL}/dupes/list`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-DupeFinder/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dupes");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching dupes:", err);
    return [];
  }
}

export async function fetchDupeFinderData(userId: string) {
  try {
    const url = `${INVENTORY_API_URL}/users/dupes?id=${userId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });
    if (!response.ok) {
      if (response.status === 404) {
        return { error: "No recorded dupes found for this user." };
      }
      throw new Error("Failed to fetch dupe finder data");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching dupe finder data:", err);
    return { error: "Failed to fetch dupe finder data. Please try again." };
  }
}

export async function fetchDuplicatesCount() {
  try {
    const url = `${INVENTORY_API_URL}/items/duplicates/count`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch duplicates count");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching duplicates count:", err);
    return { total_duplicates: 0, total_duplicates_str: "0" };
  }
}

export async function fetchLatestSeason() {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/latest`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Seasons/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch latest season");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching latest season:", err);
    return null;
  }
}

export interface SeasonContract {
  team: "Criminal" | "Police";
  name: string;
  description: string;
  reqseasonpass: boolean;
  goal: number;
  reward: number;
}

export interface SeasonContractsResponse {
  data: SeasonContract[];
  updated_at: number;
}

export async function fetchSeasonContracts(): Promise<SeasonContractsResponse | null> {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/seasons/contract`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch season contracts");
    }

    const data = await response.json();
    return data as SeasonContractsResponse;
  } catch (err) {
    console.error("[SERVER] Error fetching season contracts:", err);
    return null;
  }
}

export async function fetchSeasonsList() {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/list`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Seasons/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch seasons list");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching seasons list:", err);
    return [];
  }
}

export async function fetchSeason(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/get?id=${id}`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Seasons/1.0",
      },
    });

    if (!response.ok) {
      console.log("[SERVER] Season not found:", { id });
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching season:", err);
    return null;
  }
}

export async function fetchOnlineUsers(): Promise<OnlineUser[]> {
  try {
    const response = await fetch(`${BASE_API_URL}/users/list/online`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Presence/1.0",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch online users");
    }
    const data = await response.json();
    const list = Array.isArray(data) ? (data as OnlineUser[]) : [];
    return list;
  } catch (err) {
    console.error("[SERVER] Error fetching online users:", err);
    return [];
  }
}

export async function fetchItemFavorites(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/item/favorites?id=${id}`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Favorites/1.0",
      },
    });

    if (response.status === 404) {
      console.log(`[SERVER] Item favorites ${id} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch item favorites");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching item favorites:", err);
    return null;
  }
}

export async function fetchUserFavorites(userId: string) {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/favorites/get?user=${userId}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Favorites/1.0",
        },
      },
    );

    if (response.status === 404) {
      console.log(`[CLIENT] User favorites ${userId} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user favorites");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[CLIENT] Error fetching user favorites:", err);
    return null;
  }
}

export async function fetchRandomItem() {
  try {
    const response = await fetch(`${BASE_API_URL}/items/random`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-ItemCatalog/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch random item");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching random item:", err);
    throw err;
  }
}

export async function fetchItemHistory(id: string) {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/item/history?id=${id}`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-ValueHistory/1.0",
      },
    });

    if (response.status === 404) {
      console.log(`[CLIENT] Value history for Item ${id} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch item history");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[CLIENT] Error fetching item history:", err);
    return null;
  }
}

export async function fetchItemsByType(type: string) {
  try {
    const response = await fetch(
      `${BASE_API_URL}/items/get?type=${encodeURIComponent(type)}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-ItemCatalog/1.0",
        },
      },
    );

    if (response.status === 404) {
      console.log(`[SERVER] Items with type ${type} not found`);
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch items by type");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching items by type:", err);
    return null;
  }
}

// Convenience wrapper for HyperChrome items only
export async function fetchHyperchromes() {
  try {
    const data = await fetchItemsByType("HyperChrome");
    return data; // Same structure as values page, filtered to HyperChromes
  } catch (err) {
    console.error("[SERVER] Error fetching hyperchromes:", err);
    return null;
  }
}

export interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: string | null;
  owner: string;
}

export async function fetchComments(
  type: string,
  id: string,
  itemType?: string,
) {
  try {
    const commentType = type === "item" ? itemType : type;
    const response = await fetch(
      `${BASE_API_URL}/comments/get?type=${commentType}&id=${id}&nocache=true`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Comments/1.0",
        },
      },
    );

    if (response.status === 404) {
      return { comments: [], userMap: {} };
    }

    if (!response.ok) {
      throw new Error("Failed to fetch comments");
    }

    const data = await response.json();
    const commentsArray = Array.isArray(data) ? data : [];

    // Fetch user data for comments server-side
    if (commentsArray.length > 0) {
      const userIds = Array.from(
        new Set(commentsArray.map((comment) => comment.user_id)),
      ).filter(Boolean) as string[];
      const userMap = await fetchUsersBatch(userIds);
      return { comments: commentsArray, userMap };
    }

    return { comments: commentsArray, userMap: {} };
  } catch (err) {
    console.error("[SERVER] Error fetching comments:", err);
    return { comments: [], userMap: {} };
  }
}

export async function fetchInventoryData(
  robloxId: string,
  timeoutMs: number = 30000,
  maxRetries: number = 3,
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const wsResult = await (async () => {
        try {
          // Dynamically import ws to avoid bundling on the client
          const wsModule = await import("ws");
          const WS: typeof WebSocket =
            (wsModule as { default?: typeof WebSocket }).default ||
            (wsModule as { WebSocket?: typeof WebSocket }).WebSocket ||
            (wsModule as unknown as typeof WebSocket);
          return await new Promise((resolve) => {
            const socket = new WS(`${INVENTORY_WS_URL}/socket`, {
              headers: {
                "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
              },
            });

            let settled = false;
            const timeout = setTimeout(() => {
              if (settled) return;
              settled = true;
              try {
                socket.close();
              } catch {}
              console.warn(
                `[WS] Timeout after ${timeoutMs / 1000}s waiting for data for user ${robloxId}`,
              );
              resolve({
                error: "timeout",
                message: `WebSocket request timed out after ${timeoutMs / 1000} seconds. Please try again.`,
              });
            }, timeoutMs);

            socket.on("open", () => {
              try {
                socket.send(
                  JSON.stringify({ action: "get_data", user_id: robloxId }),
                );
              } catch (e) {
                // If send fails, resolve with error and close
                if (!settled) {
                  settled = true;
                  clearTimeout(timeout);
                  try {
                    socket.close();
                  } catch {}
                  console.error(`[WS] Send failed for user ${robloxId}:`, e);
                  resolve({
                    error: "ws_send_error",
                    message: "Failed to send WebSocket request.",
                  });
                }
              }
            });

            socket.on("message", (data: string) => {
              if (settled) return;
              settled = true;
              clearTimeout(timeout);
              try {
                const parsed = JSON.parse(data);
                resolve(parsed);
              } catch (e) {
                console.error(`[WS] Parse error for user ${robloxId}:`, e);
                resolve({
                  error: "ws_parse_error",
                  message: "Invalid response from WebSocket server.",
                });
              } finally {
                try {
                  socket.close();
                } catch {}
              }
            });

            socket.on("error", (err: unknown) => {
              if (settled) return;
              settled = true;
              clearTimeout(timeout);
              try {
                socket.close();
              } catch {}
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              // Only log 502 errors briefly, skip verbose timeout errors
              if (errorMessage.includes("502")) {
                console.error(
                  `[WS] Connection error for user ${robloxId}: ${errorMessage}`,
                );
              }

              // Check if it's a 404 error (service unavailable)
              if (
                errorMessage.includes("404") ||
                errorMessage.includes("Unexpected server response: 404")
              ) {
                resolve({
                  error: "service_unavailable",
                  message:
                    "Inventory service is currently unavailable. Please try again later.",
                });
              } else {
                resolve({
                  error: "ws_error",
                  message: "WebSocket connection error.",
                });
              }
            });

            socket.on("close", () => {
              // If closed before message and not settled, treat as error
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                resolve({
                  error: "ws_closed",
                  message: "WebSocket closed before receiving data.",
                });
              }
            });
          });
        } catch (err) {
          console.error("[WS] Failed to initialize WebSocket client:", err);
          return {
            error: "ws_init_error",
            message: "Failed to initialize WebSocket client.",
          };
        }
      })();

      if (
        wsResult &&
        typeof wsResult === "object" &&
        "action" in wsResult &&
        "data" in wsResult
      ) {
        const envelope = wsResult as { action?: string; data?: unknown };
        const payload = envelope.data;

        // Some responses come back as ["Inventory not found.", 404]
        if (Array.isArray(payload)) {
          const [errorMessage, statusCode] = payload as unknown[];
          const isErrorTuple =
            typeof errorMessage === "string" && typeof statusCode === "number";
          if (isErrorTuple) {
            // Don't retry on 404 - user not found
            return { error: "not_found", message: errorMessage } as const;
          }
          return payload[0] ?? null;
        }

        // If payload is a string error message, normalize it
        if (typeof payload === "string") {
          return { error: "ws_error", message: payload };
        }

        return payload ?? null;
      }

      // Check if the result indicates a retryable error
      if (wsResult && typeof wsResult === "object" && "error" in wsResult) {
        const errorResult = wsResult as { error: string; message: string };

        // Don't retry on certain error types
        if (
          errorResult.error === "not_found" ||
          errorResult.error === "ws_parse_error" ||
          errorResult.error === "ws_closed" ||
          errorResult.error === "service_unavailable"
        ) {
          return errorResult;
        }

        // For retryable errors, throw to trigger retry
        if (
          errorResult.error === "timeout" ||
          errorResult.error === "ws_error" ||
          errorResult.error === "ws_init_error" ||
          errorResult.error === "ws_send_error"
        ) {
          throw new Error(
            `WebSocket error: ${errorResult.error} - ${errorResult.message}`,
          );
        }

        return errorResult;
      }

      return wsResult;
    } catch (err) {
      lastError = err as Error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if it's a retryable error
      if (
        err instanceof Error &&
        (err.message.includes("WebSocket error") ||
          err.message.includes("timeout") ||
          err.message.includes("connection") ||
          err.message.includes("network"))
      ) {
        // Only log retry attempts for the first failure, skip verbose retry logs
        if (attempt === 0) {
          console.warn(`[SERVER] Inventory data request failed, retrying...`);
        }

        // Exponential backoff: wait 1s, 2s, 4s between retries
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // For other errors, don't retry
      console.error(
        "[SERVER] Non-retryable error fetching inventory data:",
        err,
      );
      break;
    }
  }

  // All retries failed
  console.error("[SERVER] All retry attempts failed for inventory data");

  if (lastError instanceof Error && lastError.message.includes("timeout")) {
    return {
      error: "timeout",
      message: `Request timed out after ${timeoutMs}ms and ${maxRetries} retries. The user's data may be too large to process quickly.`,
    };
  }

  // Check if it's a WebSocket service error (404, service unavailable)
  if (
    lastError instanceof Error &&
    lastError.message.includes("WebSocket error: ws_error")
  ) {
    return {
      error: "service_unavailable",
      message:
        "Inventory service is currently unavailable. Please try again later.",
    };
  }

  return {
    error: "network_error",
    message:
      "Failed to fetch inventory data after multiple attempts. Please check your connection and try again.",
  };
}

export async function fetchRobloxUsersBatch(userIds: string[]) {
  try {
    // Validate input
    if (!userIds || userIds.length === 0) {
      console.log(
        "[SERVER] fetchRobloxUsersBatch: No userIds provided, returning empty data",
      );
      return { data: [] };
    }

    // Filter out any invalid IDs and convert to numbers
    const validUserIds = userIds
      .filter((id) => id && typeof id === "string" && /^\d+$/.test(id))
      .map((id) => parseInt(id, 10));

    if (validUserIds.length === 0) {
      console.warn(
        "[SERVER] fetchRobloxUsersBatch: No valid userIds found after filtering, returning empty data",
      );
      return { data: [] };
    }

    // Chunk the requests to avoid 414 errors (max 500 IDs per request)
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < validUserIds.length; i += CHUNK_SIZE) {
      chunks.push(validUserIds.slice(i, i + CHUNK_SIZE));
    }

    const allData = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const response = await fetch(
          `${INVENTORY_API_URL}/proxy/users?userIds=${chunk.join(",")}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
            },
          },
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
          allData.push(...data.data);
        } else if (data && typeof data === "object") {
          // If the API returns the object directly (not wrapped in data array)
          allData.push(data);
        }
      } catch {
        continue;
      }
    }

    // The API returns an object with user IDs as keys, so we need to merge all chunks
    const userDataObject: Record<string, RobloxUser> = {};

    allData.forEach((chunkData) => {
      if (chunkData && typeof chunkData === "object") {
        Object.assign(userDataObject, chunkData);
      }
    });

    return userDataObject;
  } catch (err) {
    console.error("[SERVER] fetchRobloxUsersBatch: Unexpected error:", err);
    return null;
  }
}

export async function fetchRobloxUser(
  robloxId: string,
): Promise<RobloxUser | null> {
  try {
    // Use the batch endpoint for single user as well
    const result = await fetchRobloxUsersBatch([robloxId]);

    if (!result || typeof result !== "object" || !(robloxId in result)) {
      throw new Error(`Failed to fetch Roblox user: ${robloxId}`);
    }

    return (result as Record<string, RobloxUser>)[robloxId];
  } catch (err) {
    console.error(`[SERVER] Error fetching Roblox user ${robloxId}:`, err);
    return null;
  }
}

export async function fetchRobloxUsersBatchLeaderboard(userIds: string[]) {
  try {
    // Validate input
    if (!userIds || userIds.length === 0) {
      console.log(
        "[SERVER] fetchRobloxUsersBatchLeaderboard: No userIds provided, returning empty data",
      );
      return {};
    }

    // Filter out any invalid IDs
    const validUserIds = userIds
      .filter((id) => id && typeof id === "string" && /^\d+$/.test(id))
      .map((id) => parseInt(id, 10));

    if (validUserIds.length === 0) {
      console.warn(
        "[SERVER] fetchRobloxUsersBatchLeaderboard: No valid userIds found after filtering, returning empty data",
      );
      return {};
    }

    try {
      const response = await fetch(
        `${INVENTORY_API_URL}/proxy/users?userIds=${validUserIds.join(",")}`,
        {
          headers: {
            "User-Agent": "JailbreakChangelogs-Leaderboard/1.0",
          },
        },
      );

      if (!response.ok) {
        console.error(
          `[SERVER] fetchRobloxUsersBatchLeaderboard: Failed with status ${response.status} ${response.statusText}`,
        );
        return {};
      }

      const data = await response.json();
      if (data && typeof data === "object") {
        return data;
      } else {
        console.warn(
          "[SERVER] fetchRobloxUsersBatchLeaderboard: Returned invalid data structure:",
          data,
        );
        return {};
      }
    } catch {
      return {};
    }
  } catch (err) {
    console.error(
      "[SERVER] fetchRobloxUsersBatchLeaderboard: Unexpected error:",
      err,
    );
    return null;
  }
}

export async function fetchRobloxAvatars(userIds: string[]) {
  try {
    // Validate input
    if (!userIds || userIds.length === 0) {
      console.log(
        "[SERVER] fetchRobloxAvatars: No userIds provided, returning empty data",
      );
      return {};
    }

    // Filter out any invalid IDs
    const validUserIds = userIds.filter(
      (id) => id && typeof id === "string" && /^\d+$/.test(id),
    );

    if (validUserIds.length === 0) {
      console.warn(
        "[SERVER] fetchRobloxAvatars: No valid userIds found after filtering, returning empty data",
      );
      return {};
    }

    // Chunk the requests to avoid 414 errors (max 500 IDs per request)
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < validUserIds.length; i += CHUNK_SIZE) {
      chunks.push(validUserIds.slice(i, i + CHUNK_SIZE));
    }

    const allData = {};

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        if (!INVENTORY_API_URL) {
          throw new TypeError("Missing INVENTORY_API_URL");
        }
        const response = await fetch(
          `${INVENTORY_API_URL}/proxy/users/avatar-headshot?userIds=${chunk.join(",")}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
            },
          },
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        if (data && typeof data === "object") {
          Object.assign(allData, data);
        }
      } catch {
        continue;
      }
    }

    return allData;
  } catch (err) {
    console.error("[SERVER] fetchRobloxAvatars: Unexpected error:", err);
    return null;
  }
}

export interface ItemCountStats {
  item_count: number;
  item_count_str: string;
  user_count: number;
  user_count_str: string;
}

export interface UserScan {
  user_id: string;
  upsert_count: number;
}

export interface MoneyLeaderboardEntry {
  user_id: string;
  money: number;
}

export async function fetchItemCountStats(): Promise<ItemCountStats | null> {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/items/count`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch item count stats");
    }

    const data = await response.json();
    return data as ItemCountStats;
  } catch {
    console.error("[SERVER] Error fetching item count stats");
    return null;
  }
}

export async function fetchUserScansLeaderboard(): Promise<UserScan[]> {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/users/scans`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user scans leaderboard");
    }

    const data = await response.json();
    return data as UserScan[];
  } catch (err) {
    console.error("[SERVER] Error fetching user scans leaderboard:", err);
    return [];
  }
}

export async function fetchMoneyLeaderboard(): Promise<
  MoneyLeaderboardEntry[]
> {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/money/leaderboard`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch money leaderboard");
    }

    const data = await response.json();
    return data as MoneyLeaderboardEntry[];
  } catch (err) {
    console.error("[SERVER] Error fetching money leaderboard:", err);
    return [];
  }
}

export async function fetchUserMoneyRank(robloxId: string) {
  try {
    const response = await fetch(
      `${INVENTORY_API_URL}/money/rank?user_id=${robloxId}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Inventory/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user money rank");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching user money rank:", err);
    return null;
  }
}

// Official scan bots
export interface OfficialBotUser {
  userId: number;
  username: string;
  displayName: string;
  hasVerifiedBadge: boolean;
}

export async function fetchOfficialScanBots(): Promise<OfficialBotUser[]> {
  try {
    if (!INVENTORY_API_URL) {
      throw new Error("Missing INVENTORY_API_URL");
    }

    const response = await fetch(`${INVENTORY_API_URL}/proxy/users/bots`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `[SERVER] fetchOfficialScanBots: Failed with status ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data as OfficialBotUser[];
    }
    console.warn(
      "[SERVER] fetchOfficialScanBots: Unexpected response shape:",
      data,
    );
    return [];
  } catch (err) {
    console.error("[SERVER] fetchOfficialScanBots: Unexpected error:", err);
    return [];
  }
}

export interface ConnectedBot {
  id: string;
  connected: boolean;
  last_heartbeat: number;
  current_job: string;
}

export interface ConnectedBotsResponse {
  bots: ConnectedBot[];
  recent_heartbeats: ConnectedBot[];
}

export async function fetchConnectedBots(): Promise<ConnectedBotsResponse | null> {
  try {
    if (!INVENTORY_API_URL) {
      throw new Error("Missing INVENTORY_API_URL");
    }

    const response = await fetch(`${INVENTORY_API_URL}/bots/connected`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `[SERVER] fetchConnectedBots: Failed with status ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();
    return data as ConnectedBotsResponse;
  } catch (err) {
    console.error("[SERVER] fetchConnectedBots: Unexpected error:", err);
    return null;
  }
}

interface InventoryItem {
  id: string;
  title: string;
  price: number;
  categoryName: string;
  itemType: string;
}

export interface QueueInfo {
  queue_length: number;
  current_delay: number;
  last_dequeue: {
    user_id: string;
    data: {
      job_id: string;
      money: number;
      data: InventoryItem[];
      user_id: string;
      last_updated: number;
      has_season_pass: boolean;
      gamepasses: string[];
      level: number;
      xp: number;
      bot_id: string;
    };
  } | null;
}

export async function fetchQueueInfo(): Promise<QueueInfo | null> {
  try {
    if (!INVENTORY_API_URL) {
      throw new Error("Missing INVENTORY_API_URL");
    }

    const response = await fetch(`${INVENTORY_API_URL}/queue/info`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Inventory/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `[SERVER] fetchQueueInfo: Failed with status ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();
    return data as QueueInfo;
  } catch (err) {
    console.error("[SERVER] fetchQueueInfo: Unexpected error:", err);
    return null;
  }
}

export interface CrewLeaderboardEntry {
  ClanId?: string; // Make ClanId optional since older seasons don't have it
  ClanName: string;
  OwnerUserId: number;
  BattlesPlayed: number;
  BattlesWon: number;
  MemberUserIds: number[];
  Rating: number;
  LastBattlePlayedUTC: number;
  LastBattlePlayedUTCStr: string;
}

const CREW_LEADERBOARD_URLS = {
  2: `${CREW_LEADERBOARD_BASE_URL}/2/latest.json`,
  3: `${CREW_LEADERBOARD_BASE_URL}/3/latest.json`,
  4: `${CREW_LEADERBOARD_BASE_URL}/4/latest.json`,
  5: `${CREW_LEADERBOARD_BASE_URL}/5/latest.json`,
  6: `${CREW_LEADERBOARD_BASE_URL}/6/latest.json`,
  7: `${CREW_LEADERBOARD_BASE_URL}/7/latest.json`,
  8: `${CREW_LEADERBOARD_BASE_URL}/8/latest.json`,
  9: `${CREW_LEADERBOARD_BASE_URL}/9/latest.json`,
  10: `${CREW_LEADERBOARD_BASE_URL}/10/latest.json`,
  11: `${CREW_LEADERBOARD_BASE_URL}/11/latest.json`,
  12: `${CREW_LEADERBOARD_BASE_URL}/12/latest.json`,
  13: `${CREW_LEADERBOARD_BASE_URL}/13/latest.json`,
  14: `${CREW_LEADERBOARD_BASE_URL}/14/latest.json`,
  15: `${CREW_LEADERBOARD_BASE_URL}/15/latest.json`,
  16: `${CREW_LEADERBOARD_BASE_URL}/16/latest.json`,
  17: `${CREW_LEADERBOARD_BASE_URL}/17/latest.json`,
  18: `${CREW_LEADERBOARD_BASE_URL}/18/latest.json`,
  19: `${CREW_LEADERBOARD_BASE_URL}/19/latest.json`,
};

export const AVAILABLE_CREW_SEASONS = Object.keys(CREW_LEADERBOARD_URLS)
  .map(Number)
  .sort((a, b) => b - a);

export async function fetchCrewLeaderboard(
  season?: number,
): Promise<CrewLeaderboardEntry[]> {
  try {
    // Default to latest season (19) if no season specified
    const targetSeason = season || 19;

    if (
      !CREW_LEADERBOARD_URLS[targetSeason as keyof typeof CREW_LEADERBOARD_URLS]
    ) {
      throw new Error(`Season ${targetSeason} not available`);
    }

    const url =
      CREW_LEADERBOARD_URLS[targetSeason as keyof typeof CREW_LEADERBOARD_URLS];
    const response = await fetch(url, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Crew/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch crew leaderboard for season ${targetSeason}`,
      );
    }

    const data = await response.json();

    // Validate that we got data
    if (!Array.isArray(data) || data.length === 0) {
      console.error(
        `[ERROR] Season ${targetSeason} API returned invalid data:`,
        data,
      );
      throw new Error(`Invalid data returned for season ${targetSeason}`);
    }

    // Normalize the data to ensure all entries have required fields
    const normalizedData = data.map(
      (
        crew: {
          ClanId?: string | number;
          ClanName?: string;
          OwnerUserId?: number;
          BattlesPlayed?: number;
          BattlesWon?: number;
          MemberUserIds?: number[];
          Rating?: number;
          LastBattlePlayedUTC?: number;
          LastBattlePlayedUTCStr?: string;
        },
        index: number,
      ) => ({
        ...crew,
        // Generate a fallback ClanId for older seasons that don't have it
        ClanId: crew.ClanId || `season_${targetSeason}_rank_${index + 1}`,
        // Ensure all required fields exist
        ClanName: crew.ClanName || "Unknown Crew",
        OwnerUserId: crew.OwnerUserId || 0,
        BattlesPlayed: crew.BattlesPlayed || 0,
        BattlesWon: crew.BattlesWon || 0,
        MemberUserIds: Array.isArray(crew.MemberUserIds)
          ? crew.MemberUserIds
          : [],
        Rating: crew.Rating || 0,
        LastBattlePlayedUTC: crew.LastBattlePlayedUTC || 0,
        LastBattlePlayedUTCStr: crew.LastBattlePlayedUTCStr || "Unknown",
      }),
    );

    return normalizedData as CrewLeaderboardEntry[];
  } catch (err) {
    console.error(
      `[SERVER] Error fetching crew leaderboard for season ${season}:`,
      err,
    );
    return [];
  }
}

export async function fetchRobloxUserByUsername(username: string) {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/proxy/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
    });

    if (!response.ok) {
      console.error(
        `[SERVER] fetchRobloxUserByUsername: Failed with status ${response.status} ${response.statusText}`,
      );
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0];
    } else {
      return null;
    }
  } catch (err) {
    console.error(
      "[SERVER] fetchRobloxUserByUsername: Error fetching user by username:",
      err,
    );
    // Re-throw the error so it can be properly handled upstream
    throw err;
  }
}

export interface UserWithFlags extends UserData {
  flags: Array<{
    flag: string;
    created_at: number;
    enabled: boolean;
    index: number;
    description: string;
  }>;
}

export async function fetchUsersWithFlags(): Promise<UserWithFlags[]> {
  try {
    const response = await fetch(`${BASE_API_URL}/users/list/flags`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-UserFlags/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users with flags");
    }

    const data = await response.json();
    return data as UserWithFlags[];
  } catch {
    console.error("[SERVER] Error fetching users with flags");
    return [];
  }
}

export async function fetchOGSearchData(
  robloxId: string,
  timeoutMs: number = 30000,
  maxRetries: number = 3,
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(
        `${INVENTORY_API_URL}/search?username=${robloxId}`,
        {
          headers: {
            "User-Agent": "JailbreakChangelogs-OGFinder/1.0",
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `[SERVER] OG Search API returned ${response.status} for ID: ${robloxId} (attempt ${attempt + 1})`,
        );

        // Don't retry on 404 - user not found
        if (response.status === 404) {
          return {
            error: "not_found",
            message:
              "This user has not been scanned by our bots yet. Their OG item data is not available.",
          };
        }

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          return {
            error: "api_error",
            message: `API returned ${response.status}. Please try again later.`,
          };
        }

        // For server errors (5xx) and rate limits (429), throw to trigger retry
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      lastError = err as Error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if it's an abort error (timeout) or network error
      if (
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("fetch"))
      ) {
        console.warn(
          `[SERVER] OG Search request failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
          err.message,
        );

        // Exponential backoff: wait 1s, 2s, 4s between retries
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`[SERVER] Retrying OG search in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // For other errors, don't retry
      console.error(
        "[SERVER] Non-retryable error fetching OG search data:",
        err,
      );
      break;
    }
  }

  // All retries failed
  console.error(
    "[SERVER] All retry attempts failed for OG search data:",
    lastError,
  );

  if (lastError instanceof Error && lastError.name === "AbortError") {
    return {
      error: "timeout",
      message: `Request timed out after ${timeoutMs}ms and ${maxRetries} retries. The user's data may be too large to process quickly.`,
    };
  }

  return {
    error: "network_error",
    message:
      "Failed to fetch data after multiple attempts. Please check your connection and try again.",
  };
}

export async function fetchInventoryDataRefresh(robloxId: string) {
  console.log(
    "[SERVER] fetchInventoryDataRefresh called with robloxId:",
    robloxId,
  );
  try {
    const response = await fetch(
      `${INVENTORY_API_URL}/user?id=${robloxId}&nocache=true`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
        },
      },
    );

    if (!response.ok) {
      console.error(
        `[SERVER] Inventory refresh API returned ${response.status} for ID: ${robloxId}`,
      );

      if (response.status === 404) {
        return {
          error: "not_found",
          message: "Inventory not found for this user.",
        };
      }

      throw new Error(
        `Failed to fetch refreshed inventory data: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SERVER] Error fetching refreshed inventory data:", err);

    if (err instanceof Error) {
      return {
        error: "fetch_error",
        message: `Failed to refresh inventory data: ${err.message}`,
      };
    }

    return {
      error: "fetch_error",
      message: "Failed to refresh inventory data. Please try again.",
    };
  }
}

export interface Supporter {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  created_at: string;
  premiumtype: number;
  usernumber: number;
}

export async function fetchSupporters(): Promise<Supporter[]> {
  try {
    const response = await fetch(`${BASE_API_URL}/users/list/supporters`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-Supporters/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch supporters");
    }

    const data = await response.json();
    return data as Supporter[];
  } catch (err) {
    console.error("[SERVER] Error fetching supporters:", err);
    return [];
  }
}
