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

export const BASE_API_URL =
  process.env.NEXT_PHASE === 'phase-production-build' || process.env.RAILWAY_ENVIRONMENT_NAME !== 'production'
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.RAILWAY_INTERNAL_API_URL;

export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
export const INVENTORY_API_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
export const CREW_LEADERBOARD_BASE_URL = process.env.NEXT_PUBLIC_CREW_LEADERBOARD_BASE_URL;
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
  const response = await fetch(`${BASE_API_URL}/users/list`);
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchUserById(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/users/get?id=${id}&nocache=true`);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage = data.detail || 'This user is banned from Jailbreak Changelogs.';
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }
      
      // Log error response for other types of errors
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2)
      });
      
      if (data.detail) {
        throw new Error(`Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`);
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    
    // Re-throw BANNED_USER errors so calling code can handle them
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('BANNED_USER:')) {
      throw error;
    }
    
    return null;
  }
}

export async function fetchUserByIdForOG(id: string) {
  try {
    const fields = [
      'id',
      'username', 
      'global_name',
      'usernumber',
      'accent_color',
      'avatar',
      'banner',
      'custom_avatar',
      'custom_banner',
      'settings'
    ].join(',');
    
    const response = await fetch(`${BASE_API_URL}/users/get?id=${id}&fields=${fields}`);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage = data.detail || 'This user is banned from Jailbreak Changelogs.';
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }
      
      // Log error response for other types of errors
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2)
      });
      
      if (data.detail) {
        throw new Error(`Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`);
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by ID for OG:', error);
    
    // Re-throw BANNED_USER errors so calling code can handle them
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('BANNED_USER:')) {
      throw error;
    }
    
    return null;
  }
}

export async function fetchUserByIdForMetadata(id: string) {
  try {
    const fields = [
      'accent_color',
      'global_name',
      'username'
    ].join(',');
    
    const response = await fetch(`${BASE_API_URL}/users/get?id=${id}&fields=${fields}`);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle banned users specifically without logging the error response
      if (response.status === 403) {
        const errorMessage = data.detail || 'This user is banned from Jailbreak Changelogs.';
        throw new Error(`BANNED_USER: ${errorMessage}`);
      }
      
      // Log error response for other types of errors
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data, null, 2)
      });
      
      if (data.detail) {
        throw new Error(`Failed to fetch user: ${response.status} - ${JSON.stringify(data.detail)}`);
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by ID for metadata:', error);
    
    // Re-throw BANNED_USER errors so calling code can handle them
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('BANNED_USER:')) {
      throw error;
    }
    
    return null;
  }
}

export const fetchUsersForList = async () => {
  const fields = [
    'id',
    'username',
    'global_name',
    'avatar',
    'usernumber',
    'accent_color',
    'custom_avatar',
    'settings',
    'premiumtype',
    'created_at',
    'roblox_id',
    'roblox_username',
    'roblox_display_name',
    'roblox_avatar',
    'roblox_join_date'
  ].join(',');
  
  const response = await fetch(`${BASE_API_URL}/users/list?fields=${fields}&nocache=true`);
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchItems() {
  try {
    const response = await fetch(`${BASE_API_URL}/items/list`);
    if (!response.ok) throw new Error("Failed to fetch items");
    const data = await response.json();
    return data as Item[];
  } catch (err) {
    console.error('[SERVER] Error fetching items:', err);
    return [];
  }
}

export async function fetchLastUpdated(items: Item[]) {
  try {
    if (!items || items.length === 0) {
      console.log('No items provided for last updated');
      return null;
    }

    // Create an array of all items including sub-items
    const allItems = items.reduce((acc: Item[], item) => {
      acc.push(item);
      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => {
          if (child.data) {
            acc.push({
              ...item,
              last_updated: child.data.last_updated,
              name: child.sub_name
            });
          }
        });
      }
      return acc;
    }, []);

    // Sort all items by last_updated in descending order and get the most recent
    const mostRecentItem = [...allItems].sort((a, b) => {
      const aTime = a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
      const bTime = b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
      return bTime - aTime;
    })[0];

    // Return the raw timestamp (in ms)
    const rawTimestamp = mostRecentItem.last_updated < 10000000000 ? mostRecentItem.last_updated * 1000 : mostRecentItem.last_updated;
    return rawTimestamp;
  } catch (err) {
    console.error('Error getting last updated time:', err);
    return null;
  }
}

export async function fetchItem(type: string, name: string): Promise<ItemDetails | null> {
  try {
    const itemName = decodeURIComponent(name);
    const itemType = decodeURIComponent(type);
    
    const response = await fetch(
      `${BASE_API_URL}/items/get?name=${encodeURIComponent(itemName)}&type=${encodeURIComponent(itemType)}`
    );
    
    if (!response.ok) {
      console.log('[SERVER] Item not found:', { type: itemType, name: itemName });
      return null;
    }
    
    const data = await response.json();
    return data as ItemDetails;
  } catch (err) {
    console.error('[SERVER] Error fetching item:', err);
    return null;
  }
}

export async function fetchChangelogList(): Promise<Changelog[]> {
  const response = await fetch(`${BASE_API_URL}/changelogs/list`);
  if (!response.ok) throw new Error('Failed to fetch changelog list');
  return response.json();
}

export async function fetchChangelog(id: string): Promise<Changelog> {
  const response = await fetch(`${BASE_API_URL}/changelogs/get?id=${id}`);
  if (!response.ok) throw new Error('Failed to fetch changelog');
  return response.json();
}

export async function fetchLatestChangelog(): Promise<Changelog> {
  const response = await fetch(`${BASE_API_URL}/changelogs/latest`);
  if (!response.ok) throw new Error('Failed to fetch latest changelog');
  return response.json();
}

export async function fetchItemsChangelog(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/items/changelogs/get?id=${id}`);
    
    if (response.status === 404) {
      console.log(`[SERVER] Items changelog ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch items changelog');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching items changelog:', err);
    return null;
  }
}

export async function fetchItemChanges(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/item/changes?id=${id}`);
    if (response.status === 404) {
      return [] as unknown[];
    }
    if (!response.ok) {
      throw new Error('Failed to fetch item changes');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching item changes:', err);
    return [] as unknown[];
  }
}

export async function fetchTradeAds() {
  try {
    const response = await fetch(`${BASE_API_URL}/trades/list?nocache=true`);
    
    if (response.status === 404) {
      // 404 means no trade ads found (all expired)
      return [];
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch trade ads');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching trade ads:', err);
    return [];
  }
}

export async function fetchTradeAd(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/trades/get?id=${id}`);
    
    if (response.status === 404) {
      console.log(`[SERVER] Trade ad ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch trade ad');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching trade ad:', err);
    return null;
  }
}

export async function fetchUsersBatch(userIds: string[]) {
  try {
    if (userIds.length === 0) {
      return {};
    }
    
    const response = await fetch(`${BASE_API_URL}/users/get/batch?ids=${userIds.join(',')}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch users batch');
    }
    
    const userDataArray = await response.json();
    const userMap = userDataArray.reduce((acc: Record<string, UserData>, user: UserData) => {
      acc[user.id] = user;
      return acc;
    }, {});
    
    return userMap;
  } catch (err) {
    console.error('[SERVER] Error fetching users batch:', err);
    return {};
  }
}

export async function fetchDupes() {
  try {
    const response = await fetch(`${BASE_API_URL}/dupes/list`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dupes');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching dupes:', err);
    return [];
  }
}

export async function fetchDupeFinderData(userId: string) {
  try {
    const url = `${INVENTORY_API_URL}/users/dupes?id=${userId}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'User not found or no dupe data available' };
      }
      throw new Error('Failed to fetch dupe finder data');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching dupe finder data:', err);
    return { error: 'Failed to fetch dupe finder data. Please try again.' };
  }
}

export async function fetchLatestSeason() {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/latest`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch latest season');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching latest season:', err);
    return null;
  }
}

export interface SeasonContract {
  team: 'Criminal' | 'Police';
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
    const response = await fetch(`${INVENTORY_API_URL}/seasons/contract`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch season contracts');
    }

    const data = await response.json();
    return data as SeasonContractsResponse;
  } catch (err) {
    console.error('[SERVER] Error fetching season contracts:', err);
    return null;
  }
}

export async function fetchSeasonsList() {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/list`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch seasons list');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching seasons list:', err);
    return [];
  }
}

export async function fetchSeason(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/seasons/get?id=${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch season');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching season:', err);
    return null;
  }
}

export async function fetchOnlineUsers(): Promise<OnlineUser[]> {
  try {
    const response = await fetch(`${BASE_API_URL}/users/list/online`);
    if (!response.ok) {
      throw new Error('Failed to fetch online users');
    }
    const data = await response.json();
    const list = Array.isArray(data) ? (data as OnlineUser[]) : [];
    return list;
  } catch (err) {
    console.error('[SERVER] Error fetching online users:', err);
    return [];
  }
}

export async function fetchItemFavorites(id: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/item/favorites?id=${id}`);
    
    if (response.status === 404) {
      console.log(`[SERVER] Item favorites ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch item favorites');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching item favorites:', err);
    return null;
  }
}

export async function fetchUserFavorites(userId: string) {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/favorites/get?user=${userId}`);
    
    if (response.status === 404) {
      console.log(`[CLIENT] User favorites ${userId} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch user favorites');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[CLIENT] Error fetching user favorites:', err);
    return null;
  }
}

export async function fetchRandomItem() {
  try {
    const response = await fetch(`${BASE_API_URL}/items/random`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch random item');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching random item:', err);
    throw err;
  }
}

export async function fetchItemHistory(id: string) {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/item/history?id=${id}`);
    
    if (response.status === 404) {
      console.log(`[CLIENT] Value history for Item ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch item history');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[CLIENT] Error fetching item history:', err);
    return null;
  }
}

export async function fetchItemsByType(type: string) {
  try {
    const response = await fetch(`${BASE_API_URL}/items/get?type=${encodeURIComponent(type)}`);
    
    if (response.status === 404) {
      console.log(`[SERVER] Items with type ${type} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch items by type');
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching items by type:', err);
    return null;
  }
}

// Convenience wrapper for HyperChrome items only
export async function fetchHyperchromes() {
  try {
    const data = await fetchItemsByType('HyperChrome');
    return data; // Same structure as values page, filtered to HyperChromes
  } catch (err) {
    console.error('[SERVER] Error fetching hyperchromes:', err);
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

export async function fetchComments(type: string, id: string, itemType?: string) {
  try {
    const commentType = type === 'item' ? itemType : type;
    const response = await fetch(`${BASE_API_URL}/comments/get?type=${commentType}&id=${id}&nocache=true`);
    
    if (response.status === 404) {
      return { comments: [], userMap: {} };
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    
    const data = await response.json();
    const commentsArray = Array.isArray(data) ? data : [];
    
    // Fetch user data for comments server-side
    if (commentsArray.length > 0) {
      const userIds = Array.from(new Set(commentsArray.map(comment => comment.user_id))).filter(Boolean) as string[];
      const userMap = await fetchUsersBatch(userIds);
      return { comments: commentsArray, userMap };
    }
    
    return { comments: commentsArray, userMap: {} };
  } catch (err) {
    console.error('[SERVER] Error fetching comments:', err);
    return { comments: [], userMap: {} };
  }
}

export async function fetchInventoryData(robloxId: string) {
  console.log('[SERVER] fetchInventoryData called with robloxId:', robloxId);
  try {
    const response = await fetch(`${INVENTORY_API_URL}/user?id=${robloxId}&nocache=true`, {
      headers: {
        'User-Agent': 'JailbreakChangelogs-InventoryChecker/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`[SERVER] Inventory API returned ${response.status} for ID: ${robloxId}`);
      
      // Handle specific HTTP status codes with user-friendly messages
      switch (response.status) {
        case 404:
          return { error: 'not_found', message: 'This user has not been scanned by our bots yet. Their inventory data is not available.' };
        case 500:
          return { error: 'server_error', message: 'Our inventory service is currently experiencing issues. Please try again in a few minutes.' };
        case 429:
          return { error: 'rate_limit', message: 'Too many requests. Please wait a moment before trying again.' };
        case 503:
          return { error: 'service_unavailable', message: 'Our inventory service is temporarily unavailable. Please try again later.' };
        default:
          return { error: 'api_error', message: `Unable to fetch inventory data (Error ${response.status}). Please try again.` };
      }
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching inventory data:', err);
    
    // Handle specific error types
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return { error: 'network_error', message: 'Network error. Please check your connection and try again.' };
    }
    
    if (err instanceof Error) {
      return { error: 'fetch_error', message: `Failed to fetch inventory data: ${err.message}` };
    }
    
    return { error: 'fetch_error', message: 'Failed to fetch inventory data. Please try again.' };
  }
}

export async function fetchRobloxUsersBatch(userIds: string[]) {
  try {
    // Validate input
    if (!userIds || userIds.length === 0) {
      console.log('[SERVER] fetchRobloxUsersBatch: No userIds provided, returning empty data');
      return { data: [] };
    }
    
    // Filter out any invalid IDs and convert to numbers
    const validUserIds = userIds
      .filter(id => id && typeof id === 'string' && /^\d+$/.test(id))
      .map(id => parseInt(id, 10));
    
    if (validUserIds.length === 0) {
      console.warn('[SERVER] fetchRobloxUsersBatch: No valid userIds found after filtering, returning empty data');
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
        const response = await fetch(`${INVENTORY_API_URL}/proxy/users?userIds=${chunk.join(',')}`, {
          headers: {
            'User-Agent': 'JailbreakChangelogs-InventoryChecker/1.0'
          }
        });
        
        if (!response.ok) {
          console.error(`[SERVER] fetchRobloxUsersBatch: Failed with status ${response.status} ${response.statusText} for chunk`);
          continue;
        }
        
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
          allData.push(...data.data);
        } else if (data && typeof data === 'object') {
          // If the API returns the object directly (not wrapped in data array)
          allData.push(data);
        }
      } catch (err) {
        console.error('[SERVER] fetchRobloxUsersBatch: Error fetching chunk:', err);
        continue;
      }
    }
    
    // The API returns an object with user IDs as keys, so we need to merge all chunks
    const userDataObject: Record<string, RobloxUser> = {};
    
    allData.forEach((chunkData) => {
      if (chunkData && typeof chunkData === 'object') {
        Object.assign(userDataObject, chunkData);
      }
    });
    
    return userDataObject;
  } catch (err) {
    console.error('[SERVER] fetchRobloxUsersBatch: Unexpected error:', err);
    return null;
  }
}

export async function fetchRobloxUser(robloxId: string): Promise<RobloxUser | null> {
  try {
    // Use the batch endpoint for single user as well
    const result = await fetchRobloxUsersBatch([robloxId]);
    
    if (!result || typeof result !== 'object' || !(robloxId in result)) {
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
      console.log('[SERVER] fetchRobloxUsersBatchLeaderboard: No userIds provided, returning empty data');
      return {};
    }
    
    // Filter out any invalid IDs
    const validUserIds = userIds
      .filter(id => id && typeof id === 'string' && /^\d+$/.test(id))
      .map(id => parseInt(id, 10));
    
    if (validUserIds.length === 0) {
      console.warn('[SERVER] fetchRobloxUsersBatchLeaderboard: No valid userIds found after filtering, returning empty data');
      return {};
    }
    
    try {
      const response = await fetch(`${INVENTORY_API_URL}/proxy/users?userIds=${validUserIds.join(',')}`, {
        headers: {
          'User-Agent': 'JailbreakChangelogs-InventoryChecker/1.0'
        }
      });
      
      if (!response.ok) {
        console.error(`[SERVER] fetchRobloxUsersBatchLeaderboard: Failed with status ${response.status} ${response.statusText}`);
        return {};
      }
      
      const data = await response.json();
      if (data && typeof data === 'object') {
        return data;
      } else {
        console.warn('[SERVER] fetchRobloxUsersBatchLeaderboard: Returned invalid data structure:', data);
        return {};
      }
    } catch (err) {
      console.error('[SERVER] fetchRobloxUsersBatchLeaderboard: Error fetching users:', err);
      return {};
    }
  } catch (err) {
    console.error('[SERVER] fetchRobloxUsersBatchLeaderboard: Unexpected error:', err);
    return null;
  }
}



export async function fetchRobloxAvatars(userIds: string[]) {
  try {
    // Validate input
    if (!userIds || userIds.length === 0) {
      console.log('[SERVER] fetchRobloxAvatars: No userIds provided, returning empty data');
      return {};
    }
    
    // Filter out any invalid IDs
    const validUserIds = userIds.filter(id => id && typeof id === 'string' && /^\d+$/.test(id));
    
    if (validUserIds.length === 0) {
      console.warn('[SERVER] fetchRobloxAvatars: No valid userIds found after filtering, returning empty data');
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
        const response = await fetch(`${INVENTORY_API_URL}/proxy/users/avatar-headshot?userIds=${chunk.join(',')}`, {
          headers: {
            'User-Agent': 'JailbreakChangelogs-InventoryChecker/1.0'
          }
        });
        
        if (!response.ok) {
          console.error(`[SERVER] fetchRobloxAvatars: Failed with status ${response.status} ${response.statusText} for chunk`);
          continue;
        }
        
        const data = await response.json();
        if (data && typeof data === 'object') {
          Object.assign(allData, data);
        }
      } catch (err) {
        console.error('[SERVER] fetchRobloxAvatars: Error fetching chunk:', err);
        continue;
      }
    }
    
    return allData;
  } catch (err) {
    console.error('[SERVER] fetchRobloxAvatars: Unexpected error:', err);
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

export async function fetchItemCountStats(): Promise<ItemCountStats | null> {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/items/count`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch item count stats');
    }
    
    const data = await response.json();
    return data as ItemCountStats;
  } catch (err) {
    console.error('[SERVER] Error fetching item count stats:', err);
    return null;
  }
}

export async function fetchUserScansLeaderboard(): Promise<UserScan[]> {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/users/scans`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user scans leaderboard');
    }
    
    const data = await response.json();
    return data as UserScan[];
  } catch (err) {
    console.error('[SERVER] Error fetching user scans leaderboard:', err);
    return [];
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

export const AVAILABLE_CREW_SEASONS = Object.keys(CREW_LEADERBOARD_URLS).map(Number).sort((a, b) => b - a);

export async function fetchCrewLeaderboard(season?: number): Promise<CrewLeaderboardEntry[]> {
  try {
    // Default to latest season (19) if no season specified
    const targetSeason = season || 19;
    
    if (!CREW_LEADERBOARD_URLS[targetSeason as keyof typeof CREW_LEADERBOARD_URLS]) {
      throw new Error(`Season ${targetSeason} not available`);
    }
    
    const url = CREW_LEADERBOARD_URLS[targetSeason as keyof typeof CREW_LEADERBOARD_URLS];
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch crew leaderboard for season ${targetSeason}`);
    }
    
    const data = await response.json();
    
    // Validate that we got data
    if (!Array.isArray(data) || data.length === 0) {
      console.error(`[ERROR] Season ${targetSeason} API returned invalid data:`, data);
      throw new Error(`Invalid data returned for season ${targetSeason}`);
    }
    
    // Normalize the data to ensure all entries have required fields
    const normalizedData = data.map((crew: {
      ClanId?: string | number;
      ClanName?: string;
      OwnerUserId?: number;
      BattlesPlayed?: number;
      BattlesWon?: number;
      MemberUserIds?: number[];
      Rating?: number;
      LastBattlePlayedUTC?: number;
      LastBattlePlayedUTCStr?: string;
    }, index: number) => ({
      ...crew,
      // Generate a fallback ClanId for older seasons that don't have it
      ClanId: crew.ClanId || `season_${targetSeason}_rank_${index + 1}`,
      // Ensure all required fields exist
      ClanName: crew.ClanName || 'Unknown Crew',
      OwnerUserId: crew.OwnerUserId || 0,
      BattlesPlayed: crew.BattlesPlayed || 0,
      BattlesWon: crew.BattlesWon || 0,
      MemberUserIds: Array.isArray(crew.MemberUserIds) ? crew.MemberUserIds : [],
      Rating: crew.Rating || 0,
      LastBattlePlayedUTC: crew.LastBattlePlayedUTC || 0,
      LastBattlePlayedUTCStr: crew.LastBattlePlayedUTCStr || 'Unknown'
    }));
    
    return normalizedData as CrewLeaderboardEntry[];
  } catch (err) {
    console.error(`[SERVER] Error fetching crew leaderboard for season ${season}:`, err);
    return [];
  }
}

export async function fetchRobloxUserByUsername(username: string) {
  try {
    const response = await fetch(`${INVENTORY_API_URL}/proxy/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JailbreakChangelogs-InventoryChecker/1.0'
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });
    
    if (!response.ok) {
      console.error(`[SERVER] fetchRobloxUserByUsername: Failed with status ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0];
    } else {
      console.warn('[SERVER] fetchRobloxUserByUsername: No user found for username:', username);
      return null;
    }
  } catch (err) {
    console.error('[SERVER] fetchRobloxUserByUsername: Error fetching user by username:', err);
    return null;
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
    const response = await fetch(`${BASE_API_URL}/users/list/flags`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch users with flags');
    }
    
    const data = await response.json();
    return data as UserWithFlags[];
  } catch (err) {
    console.error('[SERVER] Error fetching users with flags:', err);
    return [];
  }
}

export async function fetchOGSearchData(robloxId: string) {
  console.log('[SERVER] fetchOGSearchData called with robloxId:', robloxId);
  try {
    const response = await fetch(`${INVENTORY_API_URL}/search?username=${robloxId}`, {
      headers: {
        'User-Agent': 'JailbreakChangelogs-OGFinder/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`[SERVER] OG Search API returned ${response.status} for ID: ${robloxId}`);
      if (response.status === 404) {
        return { error: 'not_found', message: 'This user has not been scanned by our bots yet. Their OG item data is not available.' };
      }
      throw new Error(`Failed to fetch OG search data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching OG search data:', err);
    return { error: 'fetch_error', message: 'Failed to fetch OG search data. Please try again.' };
  }
}