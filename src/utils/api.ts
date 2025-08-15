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

interface Changelog {
  id: number;
  title: string;
  sections: string;
  image_url: string;
}

import { Item, ItemDetails } from "@/types";
import { UserData } from "@/types/auth";

export const BASE_API_URL =
  process.env.RAILWAY_ENVIRONMENT_NAME === 'production'
    ? process.env.RAILWAY_INTERNAL_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchUsers = async () => {
  const response = await fetch(`${BASE_API_URL}/users/list`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchUserById(id: string) {
  try {
    console.log('Fetching user with ID:', id);
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
    console.log('Fetching user with ID for OG:', id);
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
    console.log('Fetching user with ID for metadata:', id);
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
  
  const response = await fetch(`${BASE_API_URL}/users/list?fields=${fields}&nocache=true`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchItems() {
  try {
    console.log(`[SERVER] Fetching items from ${BASE_API_URL}...`);
    const response = await fetch(`${BASE_API_URL}/items/list`, {
      next: { revalidate: 120 }
    });
    if (!response.ok) throw new Error("Failed to fetch items");
    const data = await response.json();
    console.log(`[SERVER] Successfully fetched ${data.length} items from API`);
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
    console.log('[SERVER] Fetching item from API:', { type, name });
    const itemName = decodeURIComponent(name);
    const itemType = decodeURIComponent(type);
    
    const response = await fetch(
      `${BASE_API_URL}/items/get?name=${encodeURIComponent(itemName)}&type=${encodeURIComponent(itemType)}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes (300 seconds)
    );
    
    if (!response.ok) {
      console.log('[SERVER] Item not found:', { type: itemType, name: itemName });
      return null;
    }
    
    const data = await response.json();
    console.log('[SERVER] Successfully fetched item:', data.name);
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

export async function fetchItemsChangelog(id: string) {
  try {
    console.log(`[SERVER] Fetching items changelog ${id} from ${BASE_API_URL}...`);
    const response = await fetch(`${BASE_API_URL}/items/changelogs/get?id=${id}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (response.status === 404) {
      console.log(`[SERVER] Items changelog ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch items changelog');
    }
    
    const data = await response.json();
    console.log(`[SERVER] Successfully fetched items changelog ${id}`);
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching items changelog:', err);
    return null;
  }
}

export async function fetchTradeAds() {
  try {
    console.log(`[SERVER] Fetching trade ads from ${BASE_API_URL}...`);
    const response = await fetch(`${BASE_API_URL}/trades/list`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (response.status === 404) {
      // 404 means no trade ads found (all expired)
      console.log('[SERVER] No trade ads found');
      return [];
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch trade ads');
    }
    
    const data = await response.json();
    console.log(`[SERVER] Successfully fetched ${data.length} trade ads`);
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching trade ads:', err);
    return [];
  }
}

export async function fetchTradeAd(id: string) {
  try {
    console.log(`[SERVER] Fetching trade ad ${id} from ${BASE_API_URL}...`);
    const response = await fetch(`${BASE_API_URL}/trades/get?id=${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (response.status === 404) {
      console.log(`[SERVER] Trade ad ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch trade ad');
    }
    
    const data = await response.json();
    console.log(`[SERVER] Successfully fetched trade ad ${id}`);
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
    
    console.log(`[SERVER] Fetching ${userIds.length} users in batch from ${BASE_API_URL}...`);
    const response = await fetch(`${BASE_API_URL}/users/get/batch?ids=${userIds.join(',')}&nocache=true`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users batch');
    }
    
    const userDataArray = await response.json();
    const userMap = userDataArray.reduce((acc: Record<string, UserData>, user: UserData) => {
      acc[user.id] = user;
      return acc;
    }, {});
    
    console.log(`[SERVER] Successfully fetched ${userDataArray.length} users in batch`);
    return userMap;
  } catch (err) {
    console.error('[SERVER] Error fetching users batch:', err);
    return {};
  }
}

export async function fetchDupes() {
  try {
    console.log(`[SERVER] Fetching dupes from ${BASE_API_URL}...`);
    const response = await fetch(`${BASE_API_URL}/dupes/list`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dupes');
    }
    
    const data = await response.json();
    console.log(`[SERVER] Successfully fetched ${data.length} dupes`);
    return data;
  } catch (err) {
    console.error('[SERVER] Error fetching dupes:', err);
    return [];
  }
} 