"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { debounce } from "@/utils/helpers/debounce";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const PREFERENCE_KEY = "whats_new_disabled";
const LOCAL_CHANGE_EVENT = "whatsNewPreferenceChange";
const SYNC_DEBOUNCE_MS = 500;
const SYNC_BLOCK_MS = SYNC_DEBOUNCE_MS + 1000;

let lastLocalChange = 0;

const sendPreference = debounce((disabled: boolean) => {
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: disabled
        ? { key: PREFERENCE_KEY, value: true }
        : { key: PREFERENCE_KEY, delete: true },
    }),
  );
}, SYNC_DEBOUNCE_MS);

const readDisabled = (): boolean => {
  const cached = getCachedPreference(PREFERENCE_KEY);
  if (typeof cached === "boolean") return cached;
  return safeLocalStorage.getItem(PREFERENCE_KEY) === "true";
};

const storeDisabled = (disabled: boolean) => {
  if (disabled) {
    safeLocalStorage.setItem(PREFERENCE_KEY, "true");
  } else {
    safeLocalStorage.removeItem(PREFERENCE_KEY);
  }
};

export function useWhatsNewPreference() {
  const [disabled, setDisabledState] = useState<boolean | null>(null);
  const [preferencesSynced, setPreferencesSynced] = useState(false);

  useEffect(() => {
    setDisabledState(readDisabled());
    setPreferencesSynced(hasSyncedPreferences());

    const apply = (value: unknown) => {
      if (Date.now() - lastLocalChange < SYNC_BLOCK_MS) return;
      const next = value === true;
      setDisabledState(next);
      storeDisabled(next);
    };
    const handlePreference = (event: Event) => {
      const { key, value } = (
        event as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === PREFERENCE_KEY) apply(value);
    };
    const handlePreferences = (event: Event) => {
      const prefs = (event as CustomEvent<Record<string, unknown>>).detail;
      apply(prefs?.[PREFERENCE_KEY]);
      setPreferencesSynced(true);
    };
    const handlePreferenceDeleted = (event: Event) => {
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (key === PREFERENCE_KEY) apply(false);
    };
    const handleLocalChange = (event: Event) => {
      setDisabledState((event as CustomEvent<boolean>).detail);
    };

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener(
      "realtimePreferenceDeleted",
      handlePreferenceDeleted,
    );
    window.addEventListener(LOCAL_CHANGE_EVENT, handleLocalChange);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener(
        "realtimePreferenceDeleted",
        handlePreferenceDeleted,
      );
      window.removeEventListener(LOCAL_CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  const setDisabled = useCallback((next: boolean) => {
    lastLocalChange = Date.now();
    storeDisabled(next);
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: next }));
    sendPreference(next);
  }, []);

  return { disabled, preferencesSynced, setDisabled };
}
