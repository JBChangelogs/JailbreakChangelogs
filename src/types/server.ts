import type { UserSettings } from "@/types/auth";

export interface ServerUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
  accent_color: string | null;
  locale: string | null;
  created_at: string | number | null;
  last_seen: number | null;
  usernumber: number | null;
  custom_avatar?: string | null;
  premiumtype: number;
  settings: UserSettings;
  roblox_id: string | null;
  roblox_username?: string | null;
  roblox_display_name?: string | null;
  roblox_avatar?: string | null;
  roblox_join_date?: number | null;
}

export interface PrivateServer {
  id: number;
  link: string;
  rules: string;
  expires: string;
  created_at: string | number;
  user: ServerUser;
}

export interface PrivateServerListResponse {
  total: number;
  items: PrivateServer[];
  page: number;
  total_pages: number;
  size: number;
}
