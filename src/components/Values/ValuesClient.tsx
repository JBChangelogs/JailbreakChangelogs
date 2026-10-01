"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

const EMPTY_FAVORITES: number[] = [];
const EMPTY_ITEMS: Item[] = [];
const FILTER_SORT_STORAGE_KEY = "valuesFilterSort";
const FILTER_SORT_PREFERENCE_KEY = "values_filter_sorts";
const VALUE_SORT_PREFERENCE_KEY = "values_value_sort";
import { useQuery } from "@tanstack/react-query";
import { Item, FilterSort, ValueSort } from "@/types";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { filterByTypes } from "@/utils/trading/values";
import CategoryIcons from "@/components/Items/CategoryIcons";
import {
  fetchItemsClientPage,
  ItemSearchQueryTooShortError,
  searchItemsClientPage,
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
import { filterOptions, getServerFilters } from "./valuesFilterOptions";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import { formatRelativeDate } from "@/utils/helpers/timestamp";
import { useItemSortGroups } from "@/hooks/useItemSortGroups";
import RelatedValuePages from "./RelatedValuePages";

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

const MAX_VALUE_RANGE = 50_000_000;

export default function ValuesClient() {
  const { user } = useAuthContext();
  const [{ page, query: debouncedSearchTerm }, setSearchParams] =
    useQueryStates({
      page: parseAsInteger.withDefault(1),
      query: parseAsString.withDefault(""),
    });
  const searchQuery = debouncedSearchTerm.trim();
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);
  const handleSearchChange = useCallback(
    (term: string) => {
      const nextQuery = term.trim();
      if (nextQuery === searchQueryRef.current) return;
      void setSearchParams({ query: nextQuery || null, page: null });
    },
    [setSearchParams],
  );

  const valueSortGroups = useItemSortGroups();
  const valueSortOptions = useMemo(
    () => valueSortGroups.flatMap((group) => group.options),
    [valueSortGroups],
  );
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [clearSearchTrigger, setClearSearchTrigger] = useState(0);

  const validFilterSorts = useMemo(
    () => filterOptions.map((option) => option.value),
    [],
  );
  const validValueSorts = useMemo(
    () => valueSortOptions.map((option) => option.value as ValueSort),
    [valueSortOptions],
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

  const [favorites, setFavorites] = useState<number[]>([]);
  const favoritesQuery = useUserFavorites(user?.id);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const {
    rangeValue,
    setRangeValue,
    appliedMinValue,
    setAppliedMinValue,
    appliedMaxValue,
    setAppliedMaxValue,
  } = useValuesRangePreference(MAX_VALUE_RANGE, true);

  const serverFilters = useMemo(
    () => getServerFilters(selectedFilterSorts),
    [selectedFilterSorts],
  );
  const serverMinValue = appliedMinValue > 0 ? appliedMinValue : undefined;
  const serverMaxValue =
    appliedMaxValue < MAX_VALUE_RANGE ? appliedMaxValue : undefined;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "values-items",
      page,
      searchQuery,
      valueSort,
      serverFilters,
      serverMinValue,
      serverMaxValue,
    ],
    queryFn: ({ signal }) => {
      const options = {
        sort: valueSort,
        filters: serverFilters,
        minValue: serverMinValue,
        maxValue: serverMaxValue,
      };
      return searchQuery
        ? searchItemsClientPage(searchQuery, Math.max(1, page), signal, options)
        : fetchItemsClientPage(Math.max(1, page), signal, options);
    },
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const items = data?.items ?? EMPTY_ITEMS;
  const visibleError = data ? null : error;

  useEffect(() => {
    const handleRealtimeValues = () => {
      void refetch();
    };
    window.addEventListener("realtimeValues", handleRealtimeValues);
    return () =>
      window.removeEventListener("realtimeValues", handleRealtimeValues);
  }, [refetch]);

  useEffect(() => {
    if (!data) return;

    let cancelled = false;
    fetchLastUpdated(data.items).then((timestamp) => {
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
    if (!user?.id) {
      setFavorites([]);
    } else if (favoritesQuery.data) {
      setFavorites(favoritesQuery.data.map((fav) => fav.item.id));
    }
  }, [user?.id, favoritesQuery.data]);

  const effectiveFavorites = selectedFilterSorts.includes("favorites")
    ? favorites
    : EMPTY_FAVORITES;

  const sortedItems = useMemo(() => {
    if (!data) return EMPTY_ITEMS;
    if (!selectedFilterSorts.includes("favorites")) return items;
    const favoritesData = effectiveFavorites.map((id) => ({
      item_id: String(id),
    }));
    return filterByTypes(items, ["favorites"], favoritesData);
  }, [data, items, selectedFilterSorts, effectiveFavorites]);

  return (
    <ValuesErrorBoundary>
      <div className="border-border-card bg-secondary-bg mb-4 rounded-lg border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="page-heading">Roblox Jailbreak Value List</h1>
            </div>
            <p className="text-secondary-text mb-3">
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

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <RelatedValuePages current="values" />
              {lastUpdated && (
                <p
                  className="text-secondary-text text-xs"
                  title={`Last updated ${formatClientDate(lastUpdated)}`}
                >
                  Updated {formatRelativeDate(lastUpdated)}
                </p>
              )}
            </div>
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
        onDebouncedSearchChange={handleSearchChange}
        initialSearchTerm={debouncedSearchTerm}
        clearTrigger={clearSearchTrigger}
        selectedFilterSorts={selectedFilterSorts}
        onToggleFilterSort={handleToggleFilterSort}
        onClearFilterSorts={handleClearFilterSorts}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        valueSort={valueSort}
        setValueSort={setValueSort}
        valueSortGroups={valueSortGroups}
        rangeValue={rangeValue}
        setRangeValue={setRangeValue}
        setAppliedMinValue={setAppliedMinValue}
        appliedMaxValue={appliedMaxValue}
        setAppliedMaxValue={setAppliedMaxValue}
        searchSectionRef={searchSectionRef}
        maxValueRange={MAX_VALUE_RANGE}
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <ValuesItemsGrid
            items={isLoading ? EMPTY_ITEMS : sortedItems}
            isLoading={isLoading}
            searchErrorMessage={
              visibleError instanceof ItemSearchQueryTooShortError
                ? visibleError.message
                : visibleError
                  ? "Could not load items. Please try again."
                  : null
            }
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
            MAX_VALUE_RANGE={MAX_VALUE_RANGE}
            onResetValueRange={() => {
              setRangeValue([0, MAX_VALUE_RANGE]);
              setAppliedMinValue(0);
              setAppliedMaxValue(MAX_VALUE_RANGE);
            }}
            onClearAllFilters={() => {
              handleClearFilterSorts();
              setValueSort("cash-desc");
              setClearSearchTrigger((prev) => prev + 1);
              setRangeValue([0, MAX_VALUE_RANGE]);
              setAppliedMinValue(0);
              setAppliedMaxValue(MAX_VALUE_RANGE);
            }}
            onClearCategoryFilter={handleClearFilterSorts}
            selectedFilterSorts={selectedFilterSorts}
            totalItemsCount={data?.total ?? 0}
            totalPages={data?.total_pages ?? 0}
            pageSize={data?.size ?? 50}
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
