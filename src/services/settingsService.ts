import { UserSettings } from '@/types/auth';
import { PUBLIC_API_URL } from "@/utils/api";

export const updateBanner = async (url: string, token: string): Promise<string> => {
  const response = await fetch(`${PUBLIC_API_URL}/users/banner/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      owner: token
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update banner');
  }

  return url;
};

export const updateAvatar = async (url: string, token: string): Promise<string> => {
  const response = await fetch(`${PUBLIC_API_URL}/users/avatar/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      owner: token
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update avatar');
  }

  return url;
};

export const updateSettings = async (settings: Partial<UserSettings>, token: string): Promise<UserSettings> => {
  // Create a request body with only the specific fields that should be sent to the API
  const requestBody = {
    profile_public: settings.profile_public,
    show_recent_comments: settings.show_recent_comments,
    hide_following: settings.hide_following,
    hide_followers: settings.hide_followers,
    hide_favorites: settings.hide_favorites,
    banner_discord: settings.banner_discord,
    avatar_discord: settings.avatar_discord,
    hide_presence: settings.hide_presence,
    dms_allowed: settings.dms_allowed
  };

  // Remove any undefined or null values to keep the request body clean
  Object.keys(requestBody).forEach(key => {
    if (requestBody[key as keyof typeof requestBody] === undefined || requestBody[key as keyof typeof requestBody] === null) {
      delete requestBody[key as keyof typeof requestBody];
    }
  });

  const response = await fetch(`${PUBLIC_API_URL}/users/settings/update?user=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update settings');
  }

  return response.json();
};

export const deleteAccount = async (token: string): Promise<void> => {
  const response = await fetch(`${PUBLIC_API_URL}/users/delete?session_token=${token}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete account');
  }
}; 