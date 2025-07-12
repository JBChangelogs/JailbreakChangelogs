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

import { Item } from "@/types";
import { PROD_API_URL } from '@/services/api';
import { formatFullDate } from '@/utils/timestamp';

export const fetchUsers = async () => {
  const response = await fetch(`${PROD_API_URL}/users/list?nocache=true`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchUserById(id: string) {
  try {
    console.log('Fetching user with ID:', id);
    const response = await fetch(`${PROD_API_URL}/users/get?id=${id}&nocache=true`);
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
    
    const response = await fetch(`${PROD_API_URL}/users/get?id=${id}&fields=${fields}`);
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
    
    const response = await fetch(`${PROD_API_URL}/users/get?id=${id}&fields=${fields}`);
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
    'roblox_id',
    'roblox_username',
    'roblox_display_name',
    'roblox_avatar',
    'roblox_join_date'
  ].join(',');
  
  const response = await fetch(`${PROD_API_URL}/users/list?fields=${fields}&nocache=true`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  const data = await response.json();
  return data.sort((a: User, b: User) => a.usernumber - b.usernumber);
};

export async function fetchItems() {
  try {
    const response = await fetch(`${PROD_API_URL}/items/list`);
    if (!response.ok) throw new Error("Failed to fetch items");
    const data = await response.json();
    return data as Item[];
  } catch (err) {
    console.error('Error fetching items:', err);
    return [];
  }
}

export async function fetchLastUpdated(items: Item[]) {
  try {
    if (!items || items.length === 0) {
      console.log('No items provided for last updated');
      return '';
    }

    // Create an array of all items including sub-items
    const allItems = items.reduce((acc: Item[], item) => {
      // Add the main item
      acc.push(item);
      // Add all sub-items if they exist
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
      // Normalize timestamps to milliseconds
      const aTime = a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
      const bTime = b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
      return bTime - aTime;
    })[0];

    const formattedDate = formatFullDate(mostRecentItem.last_updated);
    return formattedDate;
  } catch (err) {
    console.error('Error getting last updated time:', err);
    return '';
  }
}

export async function fetchChangelogList(): Promise<Changelog[]> {
  const response = await fetch(`${PROD_API_URL}/changelogs/list`);
  if (!response.ok) throw new Error('Failed to fetch changelog list');
  return response.json();
}

export async function fetchChangelog(id: string): Promise<Changelog> {
  const response = await fetch(`${PROD_API_URL}/changelogs/get?id=${id}`);
  if (!response.ok) throw new Error('Failed to fetch changelog');
  return response.json();
} 