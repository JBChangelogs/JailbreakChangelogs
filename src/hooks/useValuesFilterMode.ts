"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeSessionStorage } from "@/utils/storage/safeStorage";

export type ValuesFilterMode = "single" | "multi";

const DEFAULT_FILTER_MODE: ValuesFilterMode = "single";
const LOCAL_STORAGE_KEY = "valuesFilterMode";
const PENDING_SYNC_KEY = "valuesFilterModePendingSync";
const REALTIME_PREFERENCE_KEY = "values_filter_mode";

const parseFilterMode = (value: unknown): ValuesFilterMode | null =>
  value === "single" || value === "multi" ? value : null;

export function useValuesFilterMode() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [filterMode, setFilterModeState] =
    useState<ValuesFilterMode>(DEFAULT_FILTER_MODE);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const filterModeRef = useRef(filterMode);
  const pendingSyncRef = useRef(false);

  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);

  const applyModeLocally = useCallback((mode: ValuesFilterMode) => {
    filterModeRef.current = mode;
    setFilterModeState(mode);
    safeSessionStorage.setItem(LOCAL_STORAGE_KEY, mode);
  }, []);

  const markPending = useCallback((pending: boolean) => {
    pendingSyncRef.current = pending;
    if (pending) {
      safeSessionStorage.setItem(PENDING_SYNC_KEY, "true");
    } else {
      safeSessionStorage.removeItem(PENDING_SYNC_KEY);
    }
  }, []);

  useEffect(() => {
    const storedMode = parseFilterMode(
      safeSessionStorage.getItem(LOCAL_STORAGE_KEY),
    );
    pendingSyncRef.current =
      safeSessionStorage.getItem(PENDING_SYNC_KEY) === "true";
    if (storedMode) applyModeLocally(storedMode);
    setHasHydrated(true);
  }, [applyModeLocally]);

  const sendPreference = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: {
          key: REALTIME_PREFERENCE_KEY,
          value: filterModeRef.current,
        },
      }),
    );
  }, []);

  useEffect(() => {
    if (!hasHydrated || isLoading) return;
    if (!isAuthenticated) {
      setIsResolved(true);
      return;
    }
    if (!hasSyncedPreferences()) {
      setIsResolved(false);
      return;
    }

    const serverMode = parseFilterMode(
      getCachedPreference(REALTIME_PREFERENCE_KEY),
    );
    if (pendingSyncRef.current) {
      if (serverMode === filterModeRef.current) {
        markPending(false);
      } else {
        sendPreference();
      }
      setIsResolved(true);
      return;
    }

    if (serverMode) {
      applyModeLocally(serverMode);
    } else {
      applyModeLocally(DEFAULT_FILTER_MODE);
    }
    setIsResolved(true);
  }, [
    applyModeLocally,
    hasHydrated,
    isAuthenticated,
    isLoading,
    markPending,
    sendPreference,
  ]);

  useEffect(() => {
    const handlePreference = (event: Event) => {
      if (!isAuthenticated) return;
      const { key, value } = (
        event as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key !== REALTIME_PREFERENCE_KEY) return;

      const serverMode = parseFilterMode(value);
      if (!serverMode) return;
      if (pendingSyncRef.current) {
        if (serverMode === filterModeRef.current) markPending(false);
        else sendPreference();
        setIsResolved(true);
        return;
      }
      applyModeLocally(serverMode);
      setIsResolved(true);
    };

    const handlePreferences = (event: Event) => {
      if (!isAuthenticated) return;
      const preferences = (event as CustomEvent<Record<string, unknown>>)
        .detail;
      const serverMode = parseFilterMode(
        preferences?.[REALTIME_PREFERENCE_KEY],
      );

      if (pendingSyncRef.current) {
        if (serverMode === filterModeRef.current) markPending(false);
        else sendPreference();
        setIsResolved(true);
        return;
      }

      applyModeLocally(serverMode ?? DEFAULT_FILTER_MODE);
      setIsResolved(true);
    };

    const handlePreferenceDeleted = (event: Event) => {
      if (!isAuthenticated || pendingSyncRef.current) return;
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (key === REALTIME_PREFERENCE_KEY) {
        applyModeLocally(DEFAULT_FILTER_MODE);
        setIsResolved(true);
      }
    };

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener(
      "realtimePreferenceDeleted",
      handlePreferenceDeleted,
    );
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener(
        "realtimePreferenceDeleted",
        handlePreferenceDeleted,
      );
    };
  }, [applyModeLocally, isAuthenticated, markPending, sendPreference]);

  const setFilterMode = useCallback(
    (mode: ValuesFilterMode) => {
      if (mode === filterModeRef.current) return;
      applyModeLocally(mode);
      markPending(true);
      setIsResolved(true);
      sendPreference();
    },
    [applyModeLocally, markPending, sendPreference],
  );

  return { filterMode, setFilterMode, isResolved };
}
