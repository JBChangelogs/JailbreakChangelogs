"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { FilterSort, ValueSort } from "@/types";
import { safeSessionStorage } from "@/utils/storage/safeStorage";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";

type StorageKeys = {
  filterSort?: string;
  valueSort?: string;
};

type UrlSyncOptions = {
  enabled?: boolean;
  cleanupPath?: string;
};

type UseValueSortStateOptions = {
  defaultFilterSort?: FilterSort;
  defaultValueSort?: ValueSort;
  storageKeys?: StorageKeys;
  validFilterSorts?: readonly FilterSort[];
  validValueSorts?: readonly ValueSort[];
  urlSync?: UrlSyncOptions;
  valuePreferenceKey?: string;
};

const isValidValue = <T extends string>(
  value: string | null,
  validValues?: readonly T[],
): value is T => {
  if (!value) return false;
  if (!validValues || validValues.length === 0) return true;
  return validValues.includes(value as T);
};

export const useValueSortState = (options: UseValueSortStateOptions = {}) => {
  const {
    defaultFilterSort = "name-all-items",
    defaultValueSort = "cash-desc",
    storageKeys,
    validFilterSorts,
    validValueSorts,
    urlSync,
    valuePreferenceKey,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldSyncUrl = urlSync?.enabled;

  const [filterSortOverride, setFilterSortOverride] = useState<
    FilterSort | undefined
  >(undefined);
  const [valueSortOverride, setValueSortOverride] = useState<
    ValueSort | undefined
  >(undefined);
  const [storedFilterSort, setStoredFilterSort] = useState<
    FilterSort | undefined
  >(undefined);
  const [storedValueSort, setStoredValueSort] = useState<ValueSort | undefined>(
    undefined,
  );

  const filterStorageKey = storageKeys?.filterSort;
  const valueStorageKey = storageKeys?.valueSort;
  const canStoreFilter = Boolean(filterStorageKey);
  const canStoreValue = Boolean(valueStorageKey);

  const publishValuePreference = useCallback(
    (value: ValueSort) => {
      if (!valuePreferenceKey) return;
      window.dispatchEvent(
        new CustomEvent("sendRealtimePreference", {
          detail: { key: valuePreferenceKey, value },
        }),
      );
    },
    [valuePreferenceKey],
  );

  const setFilterSort = useCallback(
    (nextValue: FilterSort) => {
      setFilterSortOverride(nextValue);
      setStoredFilterSort(nextValue);
      if (canStoreFilter) {
        safeSessionStorage.setItem(filterStorageKey!, nextValue);
      }
    },
    [canStoreFilter, filterStorageKey],
  );

  const setValueSort = useCallback(
    (nextValue: ValueSort) => {
      setValueSortOverride(nextValue);
      setStoredValueSort(nextValue);
      if (canStoreValue) {
        safeSessionStorage.setItem(valueStorageKey!, nextValue);
      }
      publishValuePreference(nextValue);
    },
    [canStoreValue, publishValuePreference, valueStorageKey],
  );

  const validFilterSortSet = useMemo(
    () => validFilterSorts ?? [],
    [validFilterSorts],
  );
  const validValueSortSet = useMemo(
    () => validValueSorts ?? [],
    [validValueSorts],
  );

  const rawUrlFilterSort = shouldSyncUrl
    ? searchParams.get("filterSort")
    : null;
  const rawUrlValueSort = shouldSyncUrl ? searchParams.get("valueSort") : null;
  const urlFilterSort = isValidValue(rawUrlFilterSort, validFilterSortSet)
    ? (rawUrlFilterSort as FilterSort)
    : undefined;
  const urlValueSort = isValidValue(rawUrlValueSort, validValueSortSet)
    ? (rawUrlValueSort as ValueSort)
    : undefined;

  useEffect(() => {
    if (canStoreFilter) {
      const stored = safeSessionStorage.getItem(filterStorageKey!);
      setStoredFilterSort(
        isValidValue(stored, validFilterSortSet)
          ? (stored as FilterSort)
          : undefined,
      );
    }
    if (canStoreValue) {
      const cached = getCachedPreference(valuePreferenceKey ?? "");
      const stored = isValidValue(cached as string | null, validValueSortSet)
        ? (cached as string)
        : safeSessionStorage.getItem(valueStorageKey!);
      setStoredValueSort(
        isValidValue(stored, validValueSortSet)
          ? (stored as ValueSort)
          : undefined,
      );
    }
  }, [
    canStoreFilter,
    canStoreValue,
    filterStorageKey,
    validFilterSortSet,
    validValueSortSet,
    valuePreferenceKey,
    valueStorageKey,
  ]);

  useEffect(() => {
    if (!valuePreferenceKey) return;

    const applyValue = (value: unknown) => {
      if (!isValidValue(value as string | null, validValueSortSet)) return;
      const nextValue = value as ValueSort;
      setValueSortOverride(nextValue);
      setStoredValueSort(nextValue);
      if (valueStorageKey)
        safeSessionStorage.setItem(valueStorageKey, nextValue);
    };
    const resetValue = () => {
      setValueSortOverride(undefined);
      setStoredValueSort(undefined);
      if (valueStorageKey) safeSessionStorage.removeItem(valueStorageKey);
    };
    const handlePreference = (event: Event) => {
      const { key, value } = (
        event as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === valuePreferenceKey) applyValue(value);
    };
    const handlePreferences = (event: Event) => {
      const preferences = (event as CustomEvent<Record<string, unknown>>)
        .detail;
      if (valuePreferenceKey in preferences) {
        applyValue(preferences[valuePreferenceKey]);
      } else {
        resetValue();
      }
    };
    const handleDeleted = (event: Event) => {
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (key === valuePreferenceKey) resetValue();
    };

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener("realtimePreferenceDeleted", handleDeleted);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener("realtimePreferenceDeleted", handleDeleted);
    };
  }, [
    defaultValueSort,
    validValueSortSet,
    valuePreferenceKey,
    valueStorageKey,
  ]);

  useEffect(() => {
    if (urlFilterSort && canStoreFilter) {
      safeSessionStorage.setItem(filterStorageKey!, urlFilterSort);
    }
    if (urlValueSort && canStoreValue) {
      safeSessionStorage.setItem(valueStorageKey!, urlValueSort);
      publishValuePreference(urlValueSort);
    }

    if ((urlFilterSort || urlValueSort) && urlSync?.cleanupPath) {
      setTimeout(() => {
        router.replace(urlSync.cleanupPath!, { scroll: false });
      }, 0);
    }
  }, [
    canStoreFilter,
    canStoreValue,
    router,
    filterStorageKey,
    publishValuePreference,
    urlFilterSort,
    urlSync?.cleanupPath,
    urlValueSort,
    valueStorageKey,
  ]);

  const filterSort =
    urlFilterSort ??
    filterSortOverride ??
    storedFilterSort ??
    defaultFilterSort;
  const valueSort =
    urlValueSort ?? valueSortOverride ?? storedValueSort ?? defaultValueSort;

  return {
    filterSort,
    setFilterSort,
    valueSort,
    setValueSort,
  };
};
