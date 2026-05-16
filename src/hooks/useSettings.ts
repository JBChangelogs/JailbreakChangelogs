import { useState, useEffect } from "react";
import {
  UserData,
  ApiSettingsResponse,
  SupporterGift,
  SupporterHistoryEntry,
} from "@/types/auth";
import {
  fetchUserSettings,
  fetchSupporterGifts,
  fetchSupporterHistory,
  updateUserSettings,
} from "@/services/settingsService";
import { toast } from "sonner";
import { safeSetJSON } from "@/utils/storage/safeStorage";
import { formatSettingName } from "@/config/settings";

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
  const [settings, setSettings] = useState<ApiSettingsResponse | null>(null);
  const [supporterGifts, setSupporterGifts] = useState<SupporterGift[]>([]);
  const [supporterHistory, setSupporterHistory] = useState<
    SupporterHistoryEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) return;

    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      fetchUserSettings(),
      fetchSupporterGifts(),
      fetchSupporterHistory(),
    ])
      .then(([settingsResult, giftsResult, historyResult]) => {
        if (!mounted) return;

        if (settingsResult.status === "fulfilled") {
          setSettings(settingsResult.value);
        } else {
          setSettings({});
        }

        if (giftsResult.status === "fulfilled") {
          setSupporterGifts(giftsResult.value);
        } else {
          setSupporterGifts([]);
        }

        if (historyResult.status === "fulfilled") {
          setSupporterHistory(historyResult.value);
        } else {
          setSupporterHistory([]);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSettings({});
        setSupporterGifts([]);
        setSupporterHistory([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userData?.id]);

  const handleSettingChange = async (name: string, value: boolean) => {
    if (!settings || !userData) return;

    const needsPremium =
      (name === "custom_avatar" && value === true) ||
      (name === "custom_banner" && value === true);

    if (needsPremium) {
      if (
        !userData.premiumtype ||
        userData.premiumtype < 2 ||
        userData.premiumtype > 3
      ) {
        if (openModal) {
          openModal({
            feature:
              name === "custom_avatar" ? "custom_avatar" : "custom_banner",
            currentTier: userData.premiumtype || 0,
            requiredTier: 2,
            currentLimit: userData.premiumtype || 0,
            requiredLimit: "Supporter Tier 2",
          });
        }
        return;
      }
    }

    const displayName = formatSettingName(name);
    const loadingToast = toast.loading("Updating Setting", {
      description: `Saving "${displayName}"...`,
    });

    const prevSettings = settings;
    const newSettings = Object.fromEntries(
      Object.entries(settings).map(([catKey, cat]) => [
        catKey,
        {
          ...cat,
          settings: cat.settings.map((entry) =>
            entry.name === name ? { ...entry, value } : entry,
          ),
        },
      ]),
    );
    setSettings(newSettings);

    try {
      await updateUserSettings(name, value);

      const updatedUser = {
        ...userData,
        settings_v2: {
          ...userData.settings_v2,
          [name]: value,
        },
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );

      toast.success("Setting Updated", {
        id: loadingToast,
        description: `"${displayName}" has been ${value ? "enabled" : "disabled"}.`,
      });

      window.umami?.track("Update Setting", { setting: name, value });
    } catch (error) {
      setSettings(prevSettings);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  return {
    settings,
    supporterGifts,
    setSupporterGifts,
    supporterHistory,
    setSupporterHistory,
    loading,
    handleSettingChange,
  };
};
