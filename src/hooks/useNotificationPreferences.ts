"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAvailableNotificationPreferences,
  fetchUserNotificationPreferences,
  updateUserNotificationPreferences,
  type NotificationPreferenceEntry,
} from "@/services/notificationPreferencesService";

export function useNotificationPreferences(userId: string | null) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const optionsQuery = useQuery({
    queryKey: ["notification-preference-options"],
    queryFn: fetchAvailableNotificationPreferences,
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    retryDelay: 1_000,
  });
  const userPrefsQuery = useQuery({
    queryKey: ["notification-preferences", userId],
    queryFn: fetchUserNotificationPreferences,
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: 1,
    retryDelay: 1_000,
    refetchOnWindowFocus: false,
  });
  const prefs = useMemo(() => {
    if (!optionsQuery.data || !userPrefsQuery.data) return null;
    const explicitMap = new Map(
      userPrefsQuery.data.preferences.map((preference) => [
        preference.title,
        preference.enabled,
      ]),
    );
    return optionsQuery.data.map((title): NotificationPreferenceEntry => ({
      title,
      enabled: explicitMap.get(title) ?? true,
    }));
  }, [optionsQuery.data, userPrefsQuery.data]);
  const loading = !userId || optionsQuery.isPending || userPrefsQuery.isPending;
  const error =
    updateError ??
    (prefs
      ? null
      : (optionsQuery.error?.message ?? userPrefsQuery.error?.message ?? null));

  const setPreferenceSaving = (title: string, isSaving: boolean) => {
    setSaving((previous) => ({ ...previous, [title]: isSaving }));
  };

  const handleToggle = async (title: string, nextEnabled: boolean) => {
    if (!prefs || !userPrefsQuery.data) return;

    const previousEnabled = prefs.find(
      (preference) => preference.title === title,
    )?.enabled;
    queryClient.setQueryData(["notification-preferences", userId], {
      preferences: prefs.map((preference) =>
        preference.title === title
          ? { ...preference, enabled: nextEnabled }
          : preference,
      ),
    });
    setUpdateError(null);
    setPreferenceSaving(title, true);

    const humanizedTitle = title
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    try {
      await updateUserNotificationPreferences([
        { title, enabled: nextEnabled },
      ]);
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: ["notification-preferences", userId],
          refetchType: "none",
        });
      }
      toast.success("Setting Updated", {
        description: `Notification preference for "${humanizedTitle}" has been ${nextEnabled ? "enabled" : "disabled"}.`,
      });

      window.rybbit?.event("Update Notification Preference", {
        preference: title,
        enabled: nextEnabled,
      });
    } catch (updateError) {
      // Revert only this preference; another toggle may have saved meanwhile.
      queryClient.setQueryData(
        ["notification-preferences", userId],
        (current: typeof userPrefsQuery.data) =>
          current && {
            ...current,
            preferences: current.preferences.map((preference) =>
              preference.title === title && previousEnabled !== undefined
                ? { ...preference, enabled: previousEnabled }
                : preference,
            ),
          },
      );
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update preference";
      setUpdateError(message);
      toast.error(message);
    } finally {
      setPreferenceSaving(title, false);
    }
  };

  return { prefs, loading, saving, error, handleToggle };
}
