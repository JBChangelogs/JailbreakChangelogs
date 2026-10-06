"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

interface StoredValueRange {
  min: number;
  max: number | null;
}

const LOCAL_STORAGE_KEY = "valuesValueRange";

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

export function useValuesRangePreference(
  maxValue: number,
  isDataReady: boolean,
) {
  const [rangeValue, setRangeValue] = useState<number[]>([0, maxValue]);
  const [appliedMinValue, setAppliedMinValue] = useState(0);
  const [appliedMaxValue, setAppliedMaxValue] = useState(maxValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const storedRangeRef = useRef<StoredValueRange>({ min: 0, max: null });
  const skipNextPersistRef = useRef(true);

  const applyStoredRange = useCallback(
    (stored: StoredValueRange) => {
      const normalized = normalizeRange(stored, maxValue);
      storedRangeRef.current = stored;
      skipNextPersistRef.current = true;
      setRangeValue(normalized);
      setAppliedMinValue(normalized[0]);
      setAppliedMaxValue(normalized[1]);
    },
    [maxValue],
  );

  useEffect(() => {
    if (!isDataReady || hasHydrated) return;
    const stored = parseStoredRange(
      safeLocalStorage.getItem(LOCAL_STORAGE_KEY),
    );
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
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
  }, [appliedMaxValue, appliedMinValue, hasHydrated, maxValue]);

  return {
    rangeValue,
    setRangeValue,
    appliedMinValue,
    setAppliedMinValue,
    appliedMaxValue,
    setAppliedMaxValue,
  };
}
