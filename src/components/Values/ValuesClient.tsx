"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const log = createLogger("UI");
const EMPTY_FAVORITES: number[] = [];
const EMPTY_ITEMS: Item[] = [];
const FILTER_SORT_STORAGE_KEY = "valuesFilterSort";
const FILTER_SORT_PREFERENCE_KEY = "values_filter_sorts";
const VALUE_SORT_PREFERENCE_KEY = "values_value_sort";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/IconWrapper";
import { Item, FilterSort, FavoriteItem } from "@/types";
import { sortAndFilterItems, parseCashValue } from "@/utils/trading/values";
import CategoryIcons from "@/components/Items/CategoryIcons";
import {
  fetchUserFavorites,
  fetchItemsClient,
  fetchLastUpdated,
} from "@/utils/api/api";
import { useAuthContext, useIsAuthenticated } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { safeSessionStorage } from "@/utils/storage/safeStorage";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";
import TradingGuides from "./TradingGuides";
import ValuesSearchControls from "./ValuesSearchControls";
import ValuesItemsGrid from "./ValuesItemsGrid";
import ValuesErrorBoundary from "./ValuesErrorBoundary";
import { useValueSortState } from "@/hooks/useValueSortState";
import { useValuesFilterMode } from "@/hooks/useValuesFilterMode";
import { useValuesRangePreference } from "@/hooks/useValuesRangePreference";
import { filterOptions } from "./valuesFilterOptions";
import { valueSortOptions } from "./valuesSortOptions";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatRelativeDate } from "@/utils/helpers/timestamp";

const parseFilterSorts = (
  raw: string | null,
  validValues: FilterSort[],
): FilterSort[] =>
  raw
    ? raw
        .split(",")
        .filter((value): value is FilterSort =>
          validValues.includes(value as FilterSort),
        )
    : [];

export default function ValuesClient() {
  const { user } = useAuthContext();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["values-items"],
    queryFn: fetchItemsClient,
  });
  const items = data ?? EMPTY_ITEMS;
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    const handleRealtimeValues = () => {
      void refetch();
    };

    window.addEventListener("realtimeValues", handleRealtimeValues);
    return () =>
      window.removeEventListener("realtimeValues", handleRealtimeValues);
  }, [refetch]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [clearSearchTrigger, setClearSearchTrigger] = useState(0);

  const validFilterSorts = useMemo(
    () => filterOptions.map((option) => option.value),
    [],
  );
  const validValueSorts = useMemo(
    () => valueSortOptions.map((option) => option.value),
    [],
  );

  const { valueSort, setValueSort } = useValueSortState({
    defaultValueSort: "cash-desc",
    storageKeys: {
      valueSort: "valuesValueSort",
    },
    validValueSorts,
    urlSync: {
      enabled: true,
      cleanupPath: "/values",
    },
    valuePreferenceKey: VALUE_SORT_PREFERENCE_KEY,
  });

  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();
  const {
    filterMode,
    setFilterMode,
    isResolved: isFilterModeResolved,
  } = useValuesFilterMode();

  const [selectedFilterSorts, setSelectedFilterSortsState] = useState<
    FilterSort[]
  >([]);
  const didRestoreFilterSortsRef = useRef(false);

  const persistFilterSorts = useCallback((next: FilterSort[]) => {
    if (next.length > 0) {
      safeSessionStorage.setItem(FILTER_SORT_STORAGE_KEY, next.join(","));
    } else {
      safeSessionStorage.removeItem(FILTER_SORT_STORAGE_KEY);
    }
  }, []);

  const publishFilterSorts = useCallback((next: FilterSort[]) => {
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: FILTER_SORT_PREFERENCE_KEY, value: next },
      }),
    );
  }, []);

  useEffect(() => {
    if (didRestoreFilterSortsRef.current) return;
    didRestoreFilterSortsRef.current = true;

    const fromUrl = parseFilterSorts(
      searchParams.get("filterSort"),
      validFilterSorts,
    );
    const cached = getCachedPreference(FILTER_SORT_PREFERENCE_KEY);
    const hasCachedFilters = Array.isArray(cached);
    const fromCache = hasCachedFilters
      ? cached.filter((value): value is FilterSort =>
          validFilterSorts.includes(value as FilterSort),
        )
      : [];
    const restored =
      fromUrl.length > 0
        ? fromUrl
        : hasCachedFilters
          ? fromCache
          : parseFilterSorts(
              safeSessionStorage.getItem(FILTER_SORT_STORAGE_KEY),
              validFilterSorts,
            );
    setSelectedFilterSortsState(restored);
    if (fromUrl.length > 0) {
      persistFilterSorts(fromUrl);
      publishFilterSorts(fromUrl);
    }
  }, [persistFilterSorts, publishFilterSorts, searchParams, validFilterSorts]);

  useEffect(() => {
    const applyFilters = (value: unknown) => {
      if (!Array.isArray(value)) return;
      const next = value.filter((filter): filter is FilterSort =>
        validFilterSorts.includes(filter as FilterSort),
      );
      setSelectedFilterSortsState(next);
      persistFilterSorts(next);
    };
    const resetFilters = () => {
      setSelectedFilterSortsState([]);
      persistFilterSorts([]);
    };
    const handlePreference = (event: Event) => {
      const { key, value } = (
        event as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === FILTER_SORT_PREFERENCE_KEY) applyFilters(value);
    };
    const handlePreferences = (event: Event) => {
      const preferences = (event as CustomEvent<Record<string, unknown>>)
        .detail;
      if (FILTER_SORT_PREFERENCE_KEY in preferences) {
        applyFilters(preferences[FILTER_SORT_PREFERENCE_KEY]);
      } else {
        resetFilters();
      }
    };
    const handleDeleted = (event: Event) => {
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (key === FILTER_SORT_PREFERENCE_KEY) resetFilters();
    };

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener("realtimePreferenceDeleted", handleDeleted);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener("realtimePreferenceDeleted", handleDeleted);
    };
  }, [persistFilterSorts, validFilterSorts]);

  const handleToggleFilterSort = useCallback(
    (value: FilterSort) => {
      if (value === "favorites" && !isAuthenticated) {
        toast.info("Please log in to view your favorites");
        return;
      }
      setSelectedFilterSortsState((prev) => {
        const next = prev.includes(value)
          ? filterMode === "single"
            ? []
            : prev.filter((v) => v !== value)
          : filterMode === "single"
            ? [value]
            : [...prev, value];
        persistFilterSorts(next);
        publishFilterSorts(next);
        return next;
      });
    },
    [filterMode, isAuthenticated, persistFilterSorts, publishFilterSorts],
  );

  useEffect(() => {
    if (!isFilterModeResolved || filterMode !== "single") return;
    setSelectedFilterSortsState((prev) => {
      if (prev.length <= 1) return prev;
      const next = [prev[prev.length - 1]];
      persistFilterSorts(next);
      publishFilterSorts(next);
      return next;
    });
  }, [
    filterMode,
    isFilterModeResolved,
    persistFilterSorts,
    publishFilterSorts,
  ]);

  const handleClearFilterSorts = useCallback(
    (subset?: FilterSort[]) => {
      setSelectedFilterSortsState((prev) => {
        const next = subset ? prev.filter((v) => !subset.includes(v)) : [];
        persistFilterSorts(next);
        publishFilterSorts(next);
        return next;
      });
    },
    [persistFilterSorts, publishFilterSorts],
  );

  const [sortedItems, setSortedItems] = useState<Item[]>([]);
  const [isInitialSortPending, setIsInitialSortPending] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const DYNAMIC_MAX_VALUE = useMemo(() => {
    return items.reduce((currentMax, item) => {
      if (item.tradable === 1) {
        const val = parseCashValue(item.cash_value);
        return val > currentMax ? val : currentMax;
      }
      return currentMax;
    }, 50_000_000);
  }, [items]);
  const {
    rangeValue,
    setRangeValue,
    appliedMinValue,
    setAppliedMinValue,
    appliedMaxValue,
    setAppliedMaxValue,
  } = useValuesRangePreference(DYNAMIC_MAX_VALUE, data !== undefined);

  useEffect(() => {
    if (!data) return;

    let cancelled = false;
    fetchLastUpdated(data).then((timestamp) => {
      if (!cancelled) setLastUpdated(timestamp);
    });

    return () => {
      cancelled = true;
    };
  }, [data]);

  const handleCategorySelect = (filter: FilterSort) => {
    handleToggleFilterSort(filter);

    if (searchSectionRef.current) {
      const headerOffset = 80;
      const elementPosition =
        searchSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      if (user && user.id) {
        try {
          const favoritesData = await fetchUserFavorites(user.id);
          if (favoritesData !== null && Array.isArray(favoritesData)) {
            const favoriteIds = favoritesData.map(
              (fav: FavoriteItem) => fav.item.id,
            );
            setFavorites(favoriteIds);
          }
        } catch (err) {
          log.error("Error loading favorites", err);
        }
      }
    };

    loadFavorites();
  }, [user]);

  const effectiveFavorites = selectedFilterSorts.includes("favorites")
    ? favorites
    : EMPTY_FAVORITES;

  useEffect(() => {
    if (isLoading) return;

    const updateSortedItems = async () => {
      const favoritesData = effectiveFavorites.map((id) => ({
        item_id: String(id),
      }));
      const sorted = await sortAndFilterItems(
        items,
        selectedFilterSorts,
        valueSort,
        debouncedSearchTerm,
        favoritesData,
      );
      setSortedItems(sorted);
      setIsInitialSortPending(false);
    };
    updateSortedItems();
  }, [
    items,
    debouncedSearchTerm,
    selectedFilterSorts,
    valueSort,
    effectiveFavorites,
    isLoading,
  ]);

  return (
    <ValuesErrorBoundary>
      <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-primary-text text-3xl font-bold">
                Roblox Jailbreak Value List
              </h1>
            </div>
            <p className="text-secondary-text mb-4">
              Welcome to our Roblox Jailbreak trading values database.
              We&apos;ve partnered with{" "}
              <a
                href="https://discord.com/invite/jailbreaktrading"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover transition-colors"
              >
                Trading Core
              </a>{" "}
              to bring you the most accurate and up-to-date values for all
              tradeable items in Roblox Jailbreak, from limited vehicles to rare
              cosmetics.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dupes" prefetch={false}>
                  <Icon icon="heroicons:magnifying-glass" inline={true} />
                  Dupe Finder
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/hyperchrome-pity" prefetch={false}>
                  <Icon icon="heroicons:calculator" inline={true} />
                  Hyperchrome Pity Calculator
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/items/suggestions" prefetch={false}>
                  <Icon icon="heroicons:light-bulb" inline={true} />
                  Item Suggestions
                </Link>
              </Button>
            </div>

            <Link
              href="/items/suggestions"
              prefetch={false}
              className="border-border-card bg-tertiary-bg mb-4 flex flex-col gap-1 rounded-lg border px-4 py-3 transition-colors xl:flex-row xl:items-center xl:justify-between xl:gap-3"
            >
              <p className="text-secondary-text text-sm">
                Think a value is wrong?{" "}
                <span className="text-link font-medium underline">
                  Vote on community suggestions
                </span>{" "}
                to help keep the value list accurate.
              </p>
              {lastUpdated && (
                <p className="text-secondary-text shrink-0 text-xs">
                  Last updated: {formatClientDate(lastUpdated)} (
                  {formatRelativeDate(lastUpdated)})
                </p>
              )}
            </Link>
          </div>

          <NitroInlineVideoPlayer
            slotId="values-header-video"
            className="w-full self-center lg:self-start"
          />
        </div>

        <CategoryIcons
          onSelect={handleCategorySelect}
          selectedFilters={selectedFilterSorts}
          onValueSort={setValueSort}
        />

        <TradingGuides
          selectedFilterSorts={selectedFilterSorts}
          onToggleFilterSort={handleToggleFilterSort}
          onScrollToSearch={() => {
            if (searchSectionRef.current) {
              const headerOffset = 80;
              const elementPosition =
                searchSectionRef.current.getBoundingClientRect().top;
              const offsetPosition =
                elementPosition + window.scrollY - headerOffset;
              window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
              });
            }
          }}
        />
      </div>

      <ValuesSearchControls
        onDebouncedSearchChange={setDebouncedSearchTerm}
        clearTrigger={clearSearchTrigger}
        selectedFilterSorts={selectedFilterSorts}
        onToggleFilterSort={handleToggleFilterSort}
        onClearFilterSorts={handleClearFilterSorts}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        valueSort={valueSort}
        setValueSort={setValueSort}
        rangeValue={rangeValue}
        setRangeValue={setRangeValue}
        setAppliedMinValue={setAppliedMinValue}
        appliedMaxValue={appliedMaxValue}
        setAppliedMaxValue={setAppliedMaxValue}
        searchSectionRef={searchSectionRef}
        maxValueRange={DYNAMIC_MAX_VALUE}
      />

      <Link
        href="/items/suggestions"
        prefetch={false}
        className="border-border-card bg-tertiary-bg mb-4 flex items-center justify-between rounded-lg border px-4 py-2.5 transition-colors"
      >
        <p className="text-secondary-text text-sm">
          Disagree with a value?{" "}
          <span className="text-link font-medium underline">
            Vote on community suggestions
          </span>
        </p>
        <Icon
          icon="heroicons:arrow-right"
          className="text-secondary-text h-4 w-4 shrink-0"
          inline={true}
        />
      </Link>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <ValuesItemsGrid
            items={sortedItems}
            isLoading={isLoading || isInitialSortPending}
            favorites={favorites}
            onFavoriteChange={(itemId, isFavorited) => {
              setFavorites((prev) =>
                isFavorited
                  ? [...prev, itemId]
                  : prev.filter((id) => id !== itemId),
              );
            }}
            appliedMinValue={appliedMinValue}
            appliedMaxValue={appliedMaxValue}
            MAX_VALUE_RANGE={DYNAMIC_MAX_VALUE}
            onResetValueRange={() => {
              setRangeValue([0, DYNAMIC_MAX_VALUE]);
              setAppliedMinValue(0);
              setAppliedMaxValue(DYNAMIC_MAX_VALUE);
            }}
            onClearAllFilters={() => {
              handleClearFilterSorts();
              setValueSort("cash-desc");
              setClearSearchTrigger((prev) => prev + 1);
              setRangeValue([0, DYNAMIC_MAX_VALUE]);
              setAppliedMinValue(0);
              setAppliedMaxValue(DYNAMIC_MAX_VALUE);
            }}
            onClearCategoryFilter={handleClearFilterSorts}
            selectedFilterSorts={selectedFilterSorts}
            totalItemsCount={items.length}
            valueSort={valueSort}
            debouncedSearchTerm={debouncedSearchTerm}
          />
        </div>
      </div>
    </ValuesErrorBoundary>
  );
}

function formatClientDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);

  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return dateStr.replace(",", "") + " at " + timeStr;
}
