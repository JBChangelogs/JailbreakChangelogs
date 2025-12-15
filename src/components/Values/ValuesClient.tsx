"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { use } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Item, FilterSort, ValueSort, FavoriteItem } from "@/types";
import { sortAndFilterItems } from "@/utils/values";
import toast from "react-hot-toast";
import SearchParamsHandler from "@/components/SearchParamsHandler";
import CategoryIcons from "@/components/Items/CategoryIcons";
import { fetchUserFavorites, fetchRandomItem } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthContext } from "@/contexts/AuthContext";
import TradingGuides from "./TradingGuides";
import HyperchromeCalculatorModal from "@/components/Hyperchrome/HyperchromeCalculatorModal";
import ValuesSearchControls from "./ValuesSearchControls";
import ValuesItemsGrid from "./ValuesItemsGrid";
import ValuesErrorBoundary from "./ValuesErrorBoundary";
import { safeLocalStorage } from "@/utils/safeStorage";
import NitroValuesVideoPlayer from "@/components/Ads/NitroValuesVideoPlayer";

interface ValuesClientProps {
  itemsPromise: Promise<Item[]>;
  lastUpdatedPromise: Promise<number | null>;
}

export default function ValuesClient({
  itemsPromise,
  lastUpdatedPromise,
}: ValuesClientProps) {
  const router = useRouter();
  const { user } = useAuthContext();

  const items = use(itemsPromise);
  const lastUpdated = use(lastUpdatedPromise);

  const [searchTerm, setSearchTerm] = useState("");

  // Derive initial state from URL params and localStorage
  const getInitialFilterSort = (): FilterSort => {
    if (typeof window === "undefined") return "name-all-items";
    const searchParams = new URLSearchParams(window.location.search);
    const urlFilterSort = searchParams.get("filterSort");
    if (urlFilterSort) {
      safeLocalStorage.setItem("valuesFilterSort", urlFilterSort);
      return urlFilterSort as FilterSort;
    }
    return (
      (safeLocalStorage.getItem("valuesFilterSort") as FilterSort) ||
      "name-all-items"
    );
  };

  const getInitialValueSort = (): ValueSort => {
    if (typeof window === "undefined") return "cash-desc";
    const searchParams = new URLSearchParams(window.location.search);
    const urlValueSort = searchParams.get("valueSort");
    if (urlValueSort) {
      safeLocalStorage.setItem("valuesValueSort", urlValueSort);
      return urlValueSort as ValueSort;
    }
    const savedSort = safeLocalStorage.getItem("valuesValueSort");
    // Validate that the saved sort is a valid ValueSort option
    const validSorts: ValueSort[] = [
      "random",
      "alpha-asc",
      "alpha-desc",
      "cash-desc",
      "cash-asc",
      "duped-desc",
      "duped-asc",
      "demand-desc",
      "demand-asc",
      "last-updated-desc",
      "last-updated-asc",
      "times-traded-desc",
      "times-traded-asc",
      "unique-circulation-desc",
      "unique-circulation-asc",
      "demand-multiple-desc",
      "demand-multiple-asc",
      "demand-close-to-none",
      "demand-very-low",
      "demand-low",
      "demand-medium",
      "demand-decent",
      "demand-high",
      "demand-very-high",
      "demand-extremely-high",
      "trend-stable",
      "trend-rising",
      "trend-hyped",
      "trend-dropping",
      "trend-unstable",
      "trend-hoarded",
      "trend-manipulated",
      "trend-recovering",
    ];
    return savedSort && validSorts.includes(savedSort as ValueSort)
      ? (savedSort as ValueSort)
      : "cash-desc";
  };

  const [filterSort, setFilterSort] =
    useState<FilterSort>(getInitialFilterSort);
  const [valueSort, setValueSort] = useState<ValueSort>(getInitialValueSort);
  const [sortedItems, setSortedItems] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const MAX_VALUE_RANGE = 100_000_000;
  const [rangeValue, setRangeValue] = useState<number[]>([0, MAX_VALUE_RANGE]);
  const [appliedMinValue, setAppliedMinValue] = useState<number>(0);
  const [appliedMaxValue, setAppliedMaxValue] =
    useState<number>(MAX_VALUE_RANGE);
  const [showHcModal, setShowHcModal] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#hyper-pity-calc";
  });

  const handleRandomItem = async () => {
    try {
      const loadingToast = toast.loading("Finding a random item...");
      const item = await fetchRandomItem();
      toast.dismiss(loadingToast);
      const redirectToast = toast.loading(
        `Redirecting to ${item.name} ${item.type}...`,
      );
      router.push(`/item/${item.type.toLowerCase()}/${item.name}`);
      setTimeout(() => {
        toast.dismiss(redirectToast);
      }, 2000);
    } catch (error) {
      console.error("Error fetching random item:", error);
      toast.error("Failed to fetch random item");
    }
  };

  const handleCategorySelect = (filter: FilterSort) => {
    if (filterSort === filter) {
      setFilterSort("name-all-items");
      safeLocalStorage.setItem("valuesFilterSort", "name-all-items");
    } else {
      setFilterSort(filter);
      safeLocalStorage.setItem("valuesFilterSort", filter);
    }

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
            const favoriteIds = favoritesData.map((fav: FavoriteItem) =>
              parseInt(fav.item_id, 10),
            );
            setFavorites(favoriteIds);
          }
        } catch (err) {
          console.error("Error loading favorites:", err);
        }
      }
    };

    loadFavorites();
  }, [user]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#hyper-pity-calc") {
        setShowHcModal(true);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleOpenHcModal = () => {
    setShowHcModal(true);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search + "#hyper-pity-calc",
    );
  };

  const handleCloseHcModal = () => {
    setShowHcModal(false);
    if (window.location.hash === "#hyper-pity-calc") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  };

  useEffect(() => {
    const updateSortedItems = async () => {
      const favoritesData = favorites.map((id) => ({ item_id: String(id) }));
      const sorted = await sortAndFilterItems(
        items,
        filterSort,
        valueSort,
        debouncedSearchTerm,
        favoritesData,
      );
      setSortedItems(sorted);
    };
    updateSortedItems();
  }, [items, debouncedSearchTerm, filterSort, valueSort, favorites]);

  return (
    <ValuesErrorBoundary>
      <style jsx>{`
        .sidebar-ad-container {
          width: 320px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        @media (min-width: 500px) {
          .sidebar-ad-container {
            width: 336px;
            height: 280px;
          }
        }

        @media (min-width: 768px) {
          .sidebar-ad-container {
            width: 300px;
            height: 250px;
          }
        }

        @media (min-width: 1024px) {
          .sidebar-ad-container {
            width: 300px;
            height: 600px;
          }
        }
      `}</style>
      <Suspense fallback={<div style={{ display: "none" }} />}>
        <SearchParamsHandler
          setFilterSort={setFilterSort}
          setValueSort={setValueSort}
        />
      </Suspense>

      <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
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
              <button
                onClick={handleRandomItem}
                className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-2 focus:outline-none sm:gap-2 sm:px-6 sm:py-3"
              >
                <Icon
                  icon="material-symbols:auto-awesome"
                  className="h-4 w-4 sm:h-6 sm:w-6"
                  inline={true}
                />
                <span className="text-sm sm:text-base">Random Item</span>
              </button>
              <button
                onClick={handleOpenHcModal}
                className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-2 focus:outline-none sm:gap-2 sm:px-6 sm:py-3"
              >
                <span className="text-sm sm:text-base">
                  Hyperchrome Pity Calculator
                </span>
              </button>
            </div>

            {lastUpdated && (
              <p className="text-secondary-text mb-4 text-sm">
                Last updated: {formatClientDate(lastUpdated)}
              </p>
            )}
          </div>

          <NitroValuesVideoPlayer className="min-h-[210px] w-full max-w-xs sm:max-w-sm self-center lg:self-start" />
        </div>

        <CategoryIcons
          onSelect={handleCategorySelect}
          selectedFilter={filterSort}
          onValueSort={setValueSort}
        />

        <TradingGuides
          valueSort={valueSort}
          onValueSortChange={setValueSort}
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

      <HyperchromeCalculatorModal
        open={showHcModal}
        onClose={handleCloseHcModal}
      />

      <ValuesSearchControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterSort={filterSort}
        setFilterSort={setFilterSort}
        valueSort={valueSort}
        setValueSort={setValueSort}
        rangeValue={rangeValue}
        setRangeValue={setRangeValue}
        setAppliedMinValue={setAppliedMinValue}
        setAppliedMaxValue={setAppliedMaxValue}
        searchSectionRef={searchSectionRef}
      />

      <div className="grid gap-8 grid-cols-1">
        <div className="space-y-6">
          <ValuesItemsGrid
            items={sortedItems}
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
              setFilterSort("name-all-items");
              setValueSort("cash-desc");
              setSearchTerm("");
              setRangeValue([0, MAX_VALUE_RANGE]);
              setAppliedMinValue(0);
              setAppliedMaxValue(MAX_VALUE_RANGE);
              safeLocalStorage.setItem("valuesFilterSort", "name-all-items");
              safeLocalStorage.setItem("valuesValueSort", "cash-desc");
            }}
            filterSort={filterSort}
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
