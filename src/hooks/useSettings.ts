import { useState, useEffect } from "react";
import { UserData, UserSettings } from "@/types/auth";
import { updateSettings } from "@/services/settingsService";
import toast from "react-hot-toast";

export const useSettings = (userData: UserData | null) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.settings) {
      setSettings(userData.settings);
    }
    setLoading(false);
  }, [userData]);

  const handleSettingChange = async (
    name: keyof UserSettings,
    value: number,
  ) => {
    if (!settings || !userData) return;

    try {
      // Update local state immediately for better UX
      const newSettings = { ...settings, [name]: value };
      setSettings(newSettings);

      // Update local storage
      const updatedUser = {
        ...userData,
        settings: newSettings,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

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
      localStorage.setItem("user", JSON.stringify(finalUser));

      // Dispatch authStateChanged event to notify other components
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: finalUser }),
      );

      // Show success toast
      toast.success("Setting updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");

      // Revert local state on error
      setSettings(settings);
      const revertedUser = {
        ...userData,
        settings,
      };
      localStorage.setItem("user", JSON.stringify(revertedUser));
    }
  };

  return {
    settings,
    loading,
    handleSettingChange,
  };
};
