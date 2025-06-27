import { UserSettings } from '@/types/auth';

export type SettingConfigItem = {
  displayName: string;
  description: string;
  category: string;
};

export type SettingKey = keyof UserSettings;

export const settingsConfig: Record<SettingKey, SettingConfigItem> = {
  profile_public: {
    displayName: "Public Profile",
    description: "Allow others to view your profile",
    category: "Privacy Settings"
  },
  show_recent_comments: {
    displayName: "Show Recent Comments",
    description: "Display your recent comments on your profile",
    category: "Privacy Settings"
  },
  hide_following: {
    displayName: "Hide Following",
    description: "Hide your following list from others",
    category: "Privacy Settings"
  },
  hide_followers: {
    displayName: "Hide Followers",
    description: "Hide your followers list from others",
    category: "Privacy Settings"
  },
  hide_favorites: {
    displayName: "Hide Favorites",
    description: "Hide your favorites from others",
    category: "Privacy Settings"
  },
  hide_presence: {
    displayName: "Hide Presence",
    description: "Hide your online status from others",
    category: "Privacy Settings"
  },
  banner_discord: {
    displayName: "Use Discord Banner",
    description: "Use your Discord banner as profile background",
    category: "Appearance Settings"
  },
  avatar_discord: {
    displayName: "Use Discord Avatar",
    description: "Use your Discord avatar as profile picture",
    category: "Appearance Settings"
  },
  dms_allowed: {
    displayName: "Allow Direct Messages",
    description: "Allow our discord bot to send you direct messages",
    category: "Privacy Settings"
  },
  updated_at: {
    displayName: "Last Updated",
    description: "When settings were last updated",
    category: "System"
  }
}; 