import type { UserData } from "@/types/auth";

export interface MeResponse {
  id: string;
  name: string;
  username: string;
  supporter: number;
  avatar: string;
  roblox?: {
    roblox_id?: string | null;
    roblox_username?: string | null;
    roblox_display_name?: string | null;
    roblox_avatar?: string | null;
    roblox_join_date?: number | null;
  } | null;
  settings: UserData["settings_v2"];
  flags?: UserData["flags"];
}

export function normalizeMeResponse(raw: MeResponse): UserData {
  return {
    id: raw.id,
    username: raw.name,
    global_name: raw.username,
    avatar: raw.avatar,
    premiumtype: raw.supporter,
    premiumduration: 0,
    roblox_id: raw.roblox?.roblox_id ?? "",
    roblox_username: raw.roblox?.roblox_username ?? "",
    roblox_display_name: raw.roblox?.roblox_display_name ?? "",
    roblox_avatar: raw.roblox?.roblox_avatar ?? "",
    roblox_join_date: raw.roblox?.roblox_join_date ?? 0,
    settings_v2: raw.settings,
    flags: raw.flags,
  } as UserData;
}
