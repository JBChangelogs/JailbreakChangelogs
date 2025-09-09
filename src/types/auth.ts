export interface UserSettings {
  profile_public: number; // 0 = false, 1 = true
  show_recent_comments: number; // 0 = false, 1 = true
  hide_following: number; // 0 = false, 1 = true
  hide_followers: number; // 0 = false, 1 = true
  hide_favorites: number; // 0 = false, 1 = true
  banner_discord: number; // 0 = false, 1 = true
  avatar_discord: number; // 0 = false, 1 = true
  hide_presence: number; // 0 = false, 1 = true
  dms_allowed: number; // 0 = false, 1 = true
  updated_at: number;
}

export interface UserPresence {
  status: "Online" | "Offline";
  last_updated: number;
}

export type CustomBanner = string;

export interface User {
  id: string;
  username: string;
  avatar: string; // Discord avatar hash or "None"
  banner: string | null; // Discord banner hash, "None", or null
  accent_color: string; // Color code, "None", or null
  global_name: string; // Can be "None"
  locale: string;
  created_at: string;
  last_seen: number | null;
  last_updated: number;
  usernumber: number;
  is_following?: boolean;
  custom_avatar?: string; // Optional custom avatar URL
}

export interface UserFlag {
  flag: string | null;
  created_at: number;
  enabled: boolean;
  index: number;
  description: string;
}

export interface UserData extends User {
  // Roblox fields
  roblox_id: string;
  roblox_username: string;
  roblox_display_name: string;
  roblox_avatar: string;
  roblox_join_date: number;

  // Premium fields
  premiumtype: number;
  premiumduration: number;

  // Nested objects
  settings: UserSettings;
  presence: UserPresence;
  custom_banner: CustomBanner | null;
  token: string;
  flags?: UserFlag[];
}

export interface AuthResponse {
  success: boolean;
  data?: UserData;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
}

export interface FollowerData {
  user_id: string;
  follower_id: string;
  created_at: string;
}

export interface FollowingData {
  user_id: string;
  following_id: string;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  value: number;
  type: string;
  rarity: string;
  image?: string;
}
