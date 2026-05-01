export interface UserSettings {
  profile_public: number; // 0 = false, 1 = true
  show_recent_comments: number; // 0 = false, 1 = true
  hide_following: number; // 0 = false, 1 = true
  hide_followers: number; // 0 = false, 1 = true
  hide_favorites: number; // 0 = false, 1 = true
  hide_presence: number; // 0 = false, 1 = true
  dms_allowed: number; // 0 = false, 1 = true
  updated_at: number;
}

export interface ApiSettingEntry {
  name: string;
  value: boolean;
  description: string;
  index: number;
}

export interface ApiSettingCategory {
  name: string;
  description: string;
  index: number;
  settings: ApiSettingEntry[];
}

export type ApiSettingsResponse = Record<string, ApiSettingCategory>;

export interface SupporterGift {
  id: number;
  share_id: string;
  user: string;
  level: number;
  purchase_id: string;
  sku_id: string;
  created_at: number;
}

export interface SupporterLevel {
  id: string;
  name: string;
  slug: string;
  level: number;
  is_gift: boolean;
  price: number;
  price_str: string;
  url: string;
}

export interface SupporterHistoryEntry {
  level: number;
  created_at: number | null;
}

export interface UserSettingsV2 {
  profile_public: boolean;
  show_recent_comments: boolean;
  hide_following: boolean;
  hide_followers: boolean;
  hide_favorites: boolean;
  custom_banner: boolean;
  custom_avatar: boolean;
  hide_connections: boolean;
  hide_presence: boolean;
  dms_allowed: boolean;
}

export interface UserPresence {
  status: "Online" | "Offline";
  last_updated: number;
}

export type CustomBanner = string;

export interface UserPrimaryGuild {
  tag: string | null;
  badge: string | null;
  identity_enabled: boolean;
  identity_guild_id: string | null;
}

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
  primary_guild?: UserPrimaryGuild | null;
}

export interface UserFlag {
  flag: string | null;
  created_at: number;
  enabled?: boolean;
  index?: number;
  description?: string;
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
  settings_v2?: UserSettingsV2;
  presence: UserPresence;
  custom_banner: CustomBanner | null;
  token: string;
  flags?: UserFlag[];
  primary_guild?: UserPrimaryGuild | null;
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
