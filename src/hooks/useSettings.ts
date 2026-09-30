import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { safeLocalStorage, safeSetJSON } from "@/utils/storage/safeStorage";
import { formatSettingName } from "@/config/settings";

const withSettingValue = (
  current: ApiSettingsResponse,
  name: string,
  value: boolean,
): ApiSettingsResponse =>
  Object.fromEntries(
    Object.entries(current).map(([catKey, cat]) => [
      catKey,
      {
        ...cat,
        settings: cat.settings.map((entry) =>
          entry.name === name ? { ...entry, value } : entry,
        ),
      },
    ]),
  );

export const useSettings = (
  userData: UserData | null,
  openModal?: (state: {
    feature: string;
    currentTier: number;
    requiredTier: number;
    currentLimit?: string | number;
    requiredLimit?: string | number;
  }) => void,
  refreshUser?: () => Promise<void>,
) => {
  const queryClient = useQueryClient();
  const userId = userData?.id;
  const settingsKey = ["user-settings", userId] as const;
  const giftsKey = ["supporter-gifts", userId] as const;
  const historyKey = ["supporter-history", userId] as const;
  const settingsQuery = useQuery({
    queryKey: settingsKey,
    queryFn: fetchUserSettings,
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const giftsQuery = useQuery({
    queryKey: giftsKey,
    queryFn: fetchSupporterGifts,
    enabled: Boolean(userId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const historyQuery = useQuery({
    queryKey: historyKey,
    queryFn: fetchSupporterHistory,
    enabled: Boolean(userId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const settings: ApiSettingsResponse | null =
    settingsQuery.data ?? (settingsQuery.isError ? {} : null);
  const supporterGifts = giftsQuery.data ?? [];
  const supporterHistory = historyQuery.data ?? [];
  const loading =
    !userId ||
    settingsQuery.isPending ||
    giftsQuery.isPending ||
    historyQuery.isPending;

  const setSettings = (value: ApiSettingsResponse) => {
    queryClient.setQueryData(settingsKey, value);
  };
  const setSupporterGifts: Dispatch<SetStateAction<SupporterGift[]>> =
    useCallback(
      (value) => {
        queryClient.setQueryData<SupporterGift[]>(
          ["supporter-gifts", userId],
          (previous) =>
            typeof value === "function" ? value(previous ?? []) : value,
        );
      },
      [queryClient, userId],
    );
  const setSupporterHistory: Dispatch<SetStateAction<SupporterHistoryEntry[]>> =
    useCallback(
      (value) => {
        queryClient.setQueryData<SupporterHistoryEntry[]>(
          ["supporter-history", userId],
          (previous) =>
            typeof value === "function" ? value(previous ?? []) : value,
        );
      },
      [queryClient, userId],
    );

  const handleSettingChange = async (name: string, value: boolean) => {
    if (!settings || !userData) return;

    // Preferences are client-side only — no server API call
    if (name === "twemoji_enabled") {
      safeLocalStorage.setItem("twemoji_enabled", String(value));
      window.dispatchEvent(
        new CustomEvent("sendRealtimePreference", {
          detail: { key: "twemoji_enabled", value },
        }),
      );
      // Still update the local settings state so the toggle reflects correctly
      setSettings(withSettingValue(settings, name, value));
      return;
    }

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

    const previousValue = Object.values(settings)
      .flatMap((category) => category.settings)
      .find((entry) => entry.name === name)?.value;
    try {
      await queryClient.cancelQueries({ queryKey: settingsKey });
      queryClient.setQueryData<ApiSettingsResponse>(settingsKey, (current) =>
        current ? withSettingValue(current, name, value) : current,
      );
      await updateUserSettings(name, value);
      await queryClient.invalidateQueries({
        queryKey: ["user-settings", userData.id],
        refetchType: "none",
      });

      toast.success("Setting Updated", {
        id: loadingToast,
        description: `"${displayName}" has been ${value ? "enabled" : "disabled"}.`,
      });

      if (name === "custom_avatar" && refreshUser) {
        // /users/me returns the effective avatar in `avatar`, so refresh it
        // in the background after the setting itself has been saved.
        void refreshUser();
      } else {
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
      }

      window.rybbit?.event("Update Setting", { setting: name, value });
    } catch (error) {
      if (previousValue !== undefined) {
        queryClient.setQueryData<ApiSettingsResponse>(settingsKey, (current) =>
          current ? withSettingValue(current, name, previousValue) : current,
        );
      }
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
