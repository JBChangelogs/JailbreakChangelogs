"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchAvailableNotificationPreferences,
  fetchUserNotificationPreferences,
  updateUserNotificationPreferences,
  type NotificationPreferenceEntry,
} from "@/services/notificationPreferencesService";

export function useNotificationPreferences(userId: string | null) {
  const [prefs, setPrefs] = useState<NotificationPreferenceEntry[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadNotificationPrefs() {
      setLoading(true);
      setError(null);

      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        try {
          // These hit Next.js API routes (server-side calls upstream)
          const [available, userPrefs] = await Promise.all([
            fetchAvailableNotificationPreferences(),
            fetchUserNotificationPreferences(userId!),
          ]);

          const explicitMap = new Map(
            (userPrefs.preferences ?? []).map((preference) => [
              preference.title,
              !!preference.enabled,
            ]),
          );

          // Missing preference = ON by default
          const merged: NotificationPreferenceEntry[] = available.map(
            (title) => ({
              title,
              enabled: explicitMap.has(title)
                ? (explicitMap.get(title) as boolean)
                : true,
            }),
          );

          if (mounted) {
            setPrefs(merged);
            setError(null);
          }
          break; // Success!
        } catch (loadError) {
          attempts++;
          if (attempts >= MAX_ATTEMPTS || !mounted) {
            if (mounted) {
              setPrefs([]);
              setError(
                loadError instanceof Error
                  ? loadError.message
                  : "Failed to load notification preferences",
              );
            }
            break;
          }

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempts - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (mounted) setLoading(false);
    }

    if (userId) loadNotificationPrefs();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const setPreferenceSaving = (title: string, isSaving: boolean) => {
    setSaving((previous) => ({ ...previous, [title]: isSaving }));
  };

  const handleToggle = async (title: string, nextEnabled: boolean) => {
    if (!prefs) return;

    // Optimistic UI update
    const previous = prefs;
    const next = previous.map((preference) =>
      preference.title === title
        ? { ...preference, enabled: nextEnabled }
        : preference,
    );
    setPrefs(next);
    setError(null);
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
      toast.success("Setting Updated", {
        description: `Notification preference for "${humanizedTitle}" has been ${nextEnabled ? "enabled" : "disabled"}.`,
      });

      window.rybbit?.event("Update Notification Preference", {
        preference: title,
        enabled: nextEnabled,
      });
    } catch (updateError) {
      // Revert on failure
      setPrefs(previous);
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update preference";
      setError(message);
      toast.error(message);
    } finally {
      setPreferenceSaving(title, false);
    }
  };

  return { prefs, loading, saving, error, handleToggle };
}
