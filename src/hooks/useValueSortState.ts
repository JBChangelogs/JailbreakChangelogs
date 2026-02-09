"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterSort, ValueSort } from "@/types";
import { safeSessionStorage } from "@/utils/safeStorage";

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

  const canStoreFilter = Boolean(storageKeys?.filterSort);
  const canStoreValue = Boolean(storageKeys?.valueSort);

  const setFilterSort = useCallback(
    (nextValue: FilterSort) => {
      setFilterSortOverride(nextValue);
      if (canStoreFilter) {
        safeSessionStorage.setItem(storageKeys!.filterSort!, nextValue);
      }
    },
    [canStoreFilter, storageKeys],
  );

  const setValueSort = useCallback(
    (nextValue: ValueSort) => {
      setValueSortOverride(nextValue);
      if (canStoreValue) {
        safeSessionStorage.setItem(storageKeys!.valueSort!, nextValue);
      }
    },
    [canStoreValue, storageKeys],
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

  const storedFilterSort =
    canStoreFilter &&
    isValidValue(
      safeSessionStorage.getItem(storageKeys!.filterSort!),
      validFilterSortSet,
    )
      ? (safeSessionStorage.getItem(storageKeys!.filterSort!) as FilterSort)
      : undefined;
  const storedValueSort =
    canStoreValue &&
    isValidValue(
      safeSessionStorage.getItem(storageKeys!.valueSort!),
      validValueSortSet,
    )
      ? (safeSessionStorage.getItem(storageKeys!.valueSort!) as ValueSort)
      : undefined;

  useEffect(() => {
    if (urlFilterSort && canStoreFilter) {
      safeSessionStorage.setItem(storageKeys!.filterSort!, urlFilterSort);
    }
    if (urlValueSort && canStoreValue) {
      safeSessionStorage.setItem(storageKeys!.valueSort!, urlValueSort);
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
    storageKeys,
    urlFilterSort,
    urlSync?.cleanupPath,
    urlValueSort,
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
