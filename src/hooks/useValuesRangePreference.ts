"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

interface StoredValueRange {
  min: number;
  max: number | null;
}

const LOCAL_STORAGE_KEY = "valuesValueRange";
const PENDING_SYNC_KEY = "valuesValueRangePendingSync";
const REALTIME_PREFERENCE_KEY = "values_value_range";

const parseStoredRange = (value: unknown): StoredValueRange | null => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return null;
    const { min, max } = parsed as { min?: unknown; max?: unknown };
    if (typeof min !== "number" || !Number.isFinite(min) || min < 0)
      return null;
    if (
      max !== null &&
      (typeof max !== "number" || !Number.isFinite(max) || max < 0)
    )
      return null;
    return { min, max: max as number | null };
  } catch {
    return null;
  }
};

const normalizeRange = (
  stored: StoredValueRange,
  maxValue: number,
): [number, number] => {
  const max = stored.max === null ? maxValue : Math.min(stored.max, maxValue);
  const min = Math.min(stored.min, max);
  return [Math.max(0, min), Math.max(0, max)];
};

const serializeRange = (range: StoredValueRange): string =>
  JSON.stringify(range);

export function useValuesRangePreference(
  maxValue: number,
  isDataReady: boolean,
) {
  const { isAuthenticated, isLoading, wsConnected } = useAuthContext();
  const [rangeValue, setRangeValue] = useState<number[]>([0, maxValue]);
  const [appliedMinValue, setAppliedMinValue] = useState(0);
  const [appliedMaxValue, setAppliedMaxValue] = useState(maxValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const storedRangeRef = useRef<StoredValueRange>({ min: 0, max: null });
  const pendingSyncRef = useRef(false);
  const skipNextPersistRef = useRef(true);

  const applyStoredRange = useCallback(
    (stored: StoredValueRange) => {
      const normalized = normalizeRange(stored, maxValue);
      storedRangeRef.current = stored;
      skipNextPersistRef.current = true;
      setRangeValue(normalized);
      setAppliedMinValue(normalized[0]);
      setAppliedMaxValue(normalized[1]);
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY, serializeRange(stored));
    },
    [maxValue],
  );

  const markPending = useCallback((pending: boolean) => {
    pendingSyncRef.current = pending;
    if (pending) {
      safeLocalStorage.setItem(PENDING_SYNC_KEY, "true");
    } else {
      safeLocalStorage.removeItem(PENDING_SYNC_KEY);
    }
  }, []);

  const sendPreference = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: {
          key: REALTIME_PREFERENCE_KEY,
          value: serializeRange(storedRangeRef.current),
        },
      }),
    );
  }, []);

  useEffect(() => {
    if (!isDataReady || hasHydrated) return;
    const stored = parseStoredRange(
      safeLocalStorage.getItem(LOCAL_STORAGE_KEY),
    );
    pendingSyncRef.current =
      safeLocalStorage.getItem(PENDING_SYNC_KEY) === "true";
    applyStoredRange(stored ?? { min: 0, max: null });
    setHasHydrated(true);
  }, [applyStoredRange, hasHydrated, isDataReady]);

  useEffect(() => {
    if (!hasHydrated) return;
    applyStoredRange(storedRangeRef.current);
  }, [applyStoredRange, hasHydrated, maxValue]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const stored: StoredValueRange = {
      min: Math.max(0, appliedMinValue),
      max: appliedMaxValue >= maxValue ? null : Math.max(0, appliedMaxValue),
    };
    storedRangeRef.current = stored;
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY, serializeRange(stored));
    markPending(true);
    sendPreference();
  }, [
    appliedMaxValue,
    appliedMinValue,
    hasHydrated,
    markPending,
    maxValue,
    sendPreference,
  ]);

  useEffect(() => {
    if (
      !hasHydrated ||
      isLoading ||
      !isAuthenticated ||
      !hasSyncedPreferences()
    )
      return;

    const serverRange = parseStoredRange(
      getCachedPreference(REALTIME_PREFERENCE_KEY),
    );
    if (pendingSyncRef.current) {
      if (
        serverRange &&
        serializeRange(serverRange) === serializeRange(storedRangeRef.current)
      ) {
        markPending(false);
      } else {
        sendPreference();
      }
      return;
    }

    applyStoredRange(serverRange ?? { min: 0, max: null });
  }, [
    applyStoredRange,
    hasHydrated,
    isAuthenticated,
    isLoading,
    markPending,
    sendPreference,
    wsConnected,
  ]);

  useEffect(() => {
    const applyServerValue = (value: unknown) => {
      const serverRange = parseStoredRange(value);
      if (!serverRange) return;
      if (pendingSyncRef.current) {
        if (
          serializeRange(serverRange) === serializeRange(storedRangeRef.current)
        ) {
          markPending(false);
        } else {
          sendPreference();
        }
        return;
      }
      applyStoredRange(serverRange);
    };

    const handlePreference = (event: Event) => {
      if (!isAuthenticated || !hasHydrated) return;
      const { key, value } = (
        event as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === REALTIME_PREFERENCE_KEY) applyServerValue(value);
    };

    const handlePreferences = (event: Event) => {
      if (!isAuthenticated || !hasHydrated) return;
      const preferences = (event as CustomEvent<Record<string, unknown>>)
        .detail;
      const serverRange = parseStoredRange(
        preferences?.[REALTIME_PREFERENCE_KEY],
      );
      if (pendingSyncRef.current) {
        if (
          serverRange &&
          serializeRange(serverRange) === serializeRange(storedRangeRef.current)
        ) {
          markPending(false);
        } else {
          sendPreference();
        }
        return;
      }
      applyStoredRange(serverRange ?? { min: 0, max: null });
    };

    const handlePreferenceDeleted = (event: Event) => {
      if (!isAuthenticated || !hasHydrated || pendingSyncRef.current) return;
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (key === REALTIME_PREFERENCE_KEY) {
        applyStoredRange({ min: 0, max: null });
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
  }, [
    applyStoredRange,
    hasHydrated,
    isAuthenticated,
    markPending,
    sendPreference,
  ]);

  return {
    rangeValue,
    setRangeValue,
    appliedMinValue,
    setAppliedMinValue,
    appliedMaxValue,
    setAppliedMaxValue,
  };
}
