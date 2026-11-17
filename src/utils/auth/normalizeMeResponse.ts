import type { UserData } from "@/types/auth";

export interface MeResponse {
  id: string;
  name: string;
  username: string;
  supporter: number;
  avatar_url: string;
  banner_url?: string | null;
  /** Full CDN URL, unlike the hash other endpoints return. */
  banner?: string | null;
  accent_color?: string | null;
  accent_gradient?: number | null;
  accent_style?: string | null;
  roblox?: {
    roblox_id?: string | null;
    roblox_username?: string | null;
    roblox_display_name?: string | null;
    roblox_avatar?: string | null;
    roblox_join_date?: number | null;
  } | null;
  settings?: UserData["settings"];
  presence: UserData["presence"];
  flags?: UserData["flags"];
}

export function normalizeMeResponse(raw: MeResponse): UserData {
  return {
    id: raw.id,
    username: raw.name,
    global_name: raw.username,
    avatar_url: raw.avatar_url,
    banner_url: raw.banner_url ?? null,
    banner: raw.banner ?? null,
    accent_color: raw.accent_color ?? null,
    accent_gradient: raw.accent_gradient ?? null,
    accent_style: raw.accent_style ?? "solid",
    premiumtype: raw.supporter,
    premiumduration: 0,
    roblox_id: raw.roblox?.roblox_id ?? "",
    roblox_username: raw.roblox?.roblox_username ?? "",
    roblox_display_name: raw.roblox?.roblox_display_name ?? "",
    roblox_avatar: raw.roblox?.roblox_avatar ?? "",
    roblox_join_date: raw.roblox?.roblox_join_date ?? 0,
    settings: raw.settings,
    presence: raw.presence,
    flags: raw.flags,
  } as UserData;
}
