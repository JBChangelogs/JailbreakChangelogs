import { useState } from "react";
import { UserData, UserSettings } from "@/types/auth";
import { updateSettings } from "@/services/settingsService";
import toast from "react-hot-toast";
import { safeSetJSON } from "@/utils/safeStorage";

export const useSettings = (
  userData: UserData | null,
  openModal?: (state: {
    feature: string;
    currentTier: number;
    requiredTier: number;
    currentLimit?: string | number;
    requiredLimit?: string | number;
  }) => void,
) => {
  const getInitialSettings = () => {
    return userData?.settings || null;
  };

  const [settings, setSettings] = useState<UserSettings | null>(
    getInitialSettings,
  );
  const [loading, setLoading] = useState(!userData);

  const handleSettingChange = async (
    name: keyof UserSettings,
    value: number,
  ) => {
    if (!settings || !userData) return;

    // Check if user is trying to enable custom avatar/banner but doesn't have Tier 2+
    if (
      (name === "avatar_discord" || name === "banner_discord") &&
      value === 0
    ) {
      if (!userData.premiumtype || userData.premiumtype < 2) {
        // Show supporter modal instead of making API call
        if (openModal) {
          openModal({
            feature:
              name === "avatar_discord" ? "custom_avatar" : "custom_banner",
            currentTier: userData.premiumtype || 0,
            requiredTier: 2,
            currentLimit: userData.premiumtype || 0,
            requiredLimit: "Supporter Tier 2",
          });
        }
        return; // Don't proceed with the API call
      }
    }

    try {
      // Update local state immediately for better UX
      const newSettings = { ...settings, [name]: value };
      setSettings(newSettings);

      // Update local storage
      const updatedUser = {
        ...userData,
        settings: newSettings,
      };
      safeSetJSON("user", updatedUser);

      // Prepare all settings for the API call
      const updatedSettings = {
        profile_public: newSettings.profile_public,
        show_recent_comments: newSettings.show_recent_comments,
        hide_following: newSettings.hide_following,
        hide_followers: newSettings.hide_followers,
        hide_favorites: newSettings.hide_favorites,
        banner_discord: newSettings.banner_discord,
        avatar_discord: newSettings.avatar_discord,
        hide_presence: newSettings.hide_presence,
        dms_allowed: newSettings.dms_allowed,
      };

      // Make API call to persist the change
      await updateSettings(updatedSettings);

      // Don't overwrite with server response since backend returns stale data
      // Keep the optimistic update instead
      // setSettings(serverSettings);

      // Update local storage with our optimistic update (not server response)
      const finalUser = {
        ...userData,
        settings: newSettings,
      };
      safeSetJSON("user", finalUser);

      // Dispatch authStateChanged event to notify other components
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: finalUser }),
      );

      // Show success toast
      toast.success("Setting updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      toast.error(errorMessage);

      // Revert local state on error
      setSettings(settings);
      const revertedUser = {
        ...userData,
        settings,
      };
      safeSetJSON("user", revertedUser);
    }
  };

  return {
    settings,
    loading,
    handleSettingChange,
  };
};
