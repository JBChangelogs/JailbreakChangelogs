"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const log = createLogger("UI");
const EMPTY_FAVORITES: number[] = [];
const FILTER_SORT_STORAGE_KEY = "valuesFilterSort";
import { use } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Item, FilterSort, FavoriteItem } from "@/types";
import { sortAndFilterItems, parseCashValue } from "@/utils/trading/values";
import CategoryIcons from "@/components/Items/CategoryIcons";
import { fetchUserFavorites } from "@/utils/api/api";
import { useAuthContext, useIsAuthenticated } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { safeSessionStorage } from "@/utils/storage/safeStorage";
import TradingGuides from "./TradingGuides";
import ValuesSearchControls from "./ValuesSearchControls";
import ValuesItemsGrid from "./ValuesItemsGrid";
import ValuesErrorBoundary from "./ValuesErrorBoundary";
import { useValueSortState } from "@/hooks/useValueSortState";
import { filterOptions } from "./valuesFilterOptions";
import { valueSortOptions } from "./valuesSortOptions";
import NitroValuesVideoPlayer from "@/components/Ads/NitroValuesVideoPlayer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatRelativeDate } from "@/utils/helpers/timestamp";

interface ValuesClientProps {
  itemsPromise: Promise<Item[]>;
  lastUpdatedPromise: Promise<number | null>;
}

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

export default function ValuesClient({
  itemsPromise,
  lastUpdatedPromise,
}: ValuesClientProps) {
  const { user } = useAuthContext();

  const items = use(itemsPromise);
  const lastUpdated = use(lastUpdatedPromise);

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
  });

  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();

  const [selectedFilterSorts, setSelectedFilterSortsState] = useState<
    FilterSort[]
  >(() => {
    const fromUrl = parseFilterSorts(
      searchParams.get("filterSort"),
      validFilterSorts,
    );
    if (fromUrl.length > 0) return fromUrl;

    return parseFilterSorts(
      safeSessionStorage.getItem(FILTER_SORT_STORAGE_KEY),
      validFilterSorts,
    );
  });

  const persistFilterSorts = useCallback((next: FilterSort[]) => {
    if (next.length > 0) {
      safeSessionStorage.setItem(FILTER_SORT_STORAGE_KEY, next.join(","));
    } else {
      safeSessionStorage.removeItem(FILTER_SORT_STORAGE_KEY);
    }
  }, []);

  const handleToggleFilterSort = useCallback(
    (value: FilterSort) => {
      if (value === "favorites" && !isAuthenticated) {
        toast.info("Please log in to view your favorites");
        return;
      }
      setSelectedFilterSortsState((prev) => {
        const next = prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
        persistFilterSorts(next);
        return next;
      });
    },
    [isAuthenticated, persistFilterSorts],
  );

  const handleClearFilterSorts = useCallback(
    (subset?: FilterSort[]) => {
      setSelectedFilterSortsState((prev) => {
        const next = subset ? prev.filter((v) => !subset.includes(v)) : [];
        persistFilterSorts(next);
        return next;
      });
    },
    [persistFilterSorts],
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

  const [rangeValue, setRangeValue] = useState<number[]>(() => [
    0,
    DYNAMIC_MAX_VALUE,
  ]);
  const [appliedMinValue, setAppliedMinValue] = useState<number>(0);
  const [appliedMaxValue, setAppliedMaxValue] =
    useState<number>(DYNAMIC_MAX_VALUE);

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
              <Button asChild>
                <Link href="/dupes" prefetch={false}>
                  <Icon icon="heroicons:magnifying-glass" inline={true} />
                  Dupe Finder
                </Link>
              </Button>
              <Button asChild>
                <Link href="/hyperchrome-pity" prefetch={false}>
                  Hyperchrome Pity Calculator
                </Link>
              </Button>
              <Button asChild>
                <Link href="/items/suggestions" prefetch={false}>
                  Item Suggestions
                </Link>
              </Button>
            </div>

            <Link
              href="/items/suggestions"
              prefetch={false}
              className="border-border-card bg-tertiary-bg mb-4 flex flex-col gap-1 rounded-lg border px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3"
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

          <NitroValuesVideoPlayer className="w-full self-center lg:self-start" />
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
            isLoading={isInitialSortPending}
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
