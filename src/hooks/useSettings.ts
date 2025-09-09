import { useState, useEffect } from "react";
import { UserData, UserSettings } from "@/types/auth";
import { updateSettings } from "@/services/settingsService";
import toast from "react-hot-toast";
import { getToken } from "@/utils/auth";

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
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

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
        profile_public: settings.profile_public,
        show_recent_comments: settings.show_recent_comments,
        hide_following: settings.hide_following,
        hide_followers: settings.hide_followers,
        hide_favorites: settings.hide_favorites,
        banner_discord: settings.banner_discord,
        avatar_discord: settings.avatar_discord,
        hide_presence: settings.hide_presence,
        dms_allowed: settings.dms_allowed,
        [name]: value, // Override the changed setting
      };

      // Make API call to persist the change
      const serverSettings = await updateSettings(updatedSettings, token);

      // Update state with server response
      setSettings(serverSettings);

      // Update local storage with server response
      const finalUser = {
        ...userData,
        settings: serverSettings,
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
