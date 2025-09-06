"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { use } from "react";
import {
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Item, FilterSort, ValueSort } from "@/types";
import { sortAndFilterItems } from "@/utils/values";
import toast from 'react-hot-toast';
import SearchParamsHandler from "@/components/SearchParamsHandler";
import CategoryIcons from "@/components/Items/CategoryIcons";
import { fetchUserFavorites, fetchRandomItem } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import TradingGuides from "./TradingGuides";
import ValuesSearchControls from "./ValuesSearchControls";
import ValuesItemsGrid from "./ValuesItemsGrid";

interface ValuesClientProps {
  itemsPromise: Promise<Item[]>;
  lastUpdatedPromise: Promise<number | null>;
}

export default function ValuesClient({ itemsPromise, lastUpdatedPromise }: ValuesClientProps) {
  const router = useRouter();
  
  // Use the use hook to resolve promises
  const items = use(itemsPromise);
  const lastUpdated = use(lastUpdatedPromise);
  

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");
  const [sortedItems, setSortedItems] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const MAX_VALUE_RANGE = 100_000_000;
  const [rangeValue, setRangeValue] = useState<number[]>([0, MAX_VALUE_RANGE]);
  const [appliedMinValue, setAppliedMinValue] = useState<number>(0);
  const [appliedMaxValue, setAppliedMaxValue] = useState<number>(MAX_VALUE_RANGE);

  // Load saved preferences after mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlFilterSort = searchParams.get('filterSort');
    const urlValueSort = searchParams.get('valueSort');
    
    if (urlFilterSort || urlValueSort) {
      if (urlFilterSort) {
        localStorage.setItem('valuesFilterSort', urlFilterSort);
        setFilterSort(urlFilterSort as FilterSort);
      }
      if (urlValueSort) {
        localStorage.setItem('valuesValueSort', urlValueSort);
        setValueSort(urlValueSort as ValueSort);
      }
    } else {
      // Only load from localStorage if there are no URL parameters
      const savedFilterSort = localStorage.getItem('valuesFilterSort') as FilterSort;
      const savedValueSort = localStorage.getItem('valuesValueSort') as ValueSort;
      
      if (savedFilterSort) {
        setFilterSort(savedFilterSort);
      }
      if (savedValueSort) {
        setValueSort(savedValueSort);
      }
    }
  }, []);



  const handleRandomItem = async () => {
    try {
      const loadingToast = toast.loading('Finding a random item...');
      const item = await fetchRandomItem();
      toast.dismiss(loadingToast);
      toast.success(`Redirecting to ${item.name} ${item.type}...`);
      router.push(`/item/${item.type.toLowerCase()}/${item.name}`);
    } catch (error) {
      console.error('Error fetching random item:', error);
      toast.error('Failed to fetch random item');
    }
  };

  const handleCategorySelect = (filter: FilterSort) => {
    // If clicking the same category, reset to "All Items"
    if (filterSort === filter) {
      setFilterSort("name-all-items");
      localStorage.setItem('valuesFilterSort', "name-all-items");
    } else {
      setFilterSort(filter);
      localStorage.setItem('valuesFilterSort', filter);
    }
    
    if (searchSectionRef.current) {
      const headerOffset = 80; // Value based on header height
      const elementPosition = searchSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Load favorites only when user selects favorites filter
  const loadFavorites = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.id) {
          const favoritesData = await fetchUserFavorites(userData.id);
          if (favoritesData !== null && Array.isArray(favoritesData)) {
            setFavorites(favoritesData);
          }
        }
      } catch (err) {
        console.error('Error loading favorites:', err);
      }
    }
  };

  // Load favorites only when favorites filter is selected
  useEffect(() => {
    if (filterSort === 'favorites') {
      loadFavorites();
    }
  }, [filterSort]);

  useEffect(() => {
    const updateSortedItems = async () => {
      const favoritesData = favorites.map(id => ({ item_id: String(id) }));
      const sorted = await sortAndFilterItems(items, filterSort, valueSort, debouncedSearchTerm, favoritesData);
      setSortedItems(sorted);
    };
    updateSortedItems();
  }, [items, debouncedSearchTerm, filterSort, valueSort, favorites]);






  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler 
          setFilterSort={setFilterSort} 
          setValueSort={setValueSort} 
        />
      </Suspense>
      
      <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-muted">
            Roblox Jailbreak Value List
          </h1>
        </div>
        <p className="mb-4 text-muted">
          Welcome to our Roblox Jailbreak trading values database. We&apos;ve
          partnered with{" "}
          <a
            href="https://discord.com/invite/jailbreaktrading"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-400 transition-colors"
          >
            Trading Core
          </a>
          {" "}to bring you the most accurate
          and up-to-date values for all tradeable items in Roblox Jailbreak,
          from limited vehicles to rare cosmetics.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={handleRandomItem}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-4 sm:px-6 py-2 sm:py-3 text-muted hover:bg-[#124E66] focus:outline-none"
          >
            <SparklesIcon className="h-4 w-4 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base">Random Item</span>
          </button>
        </div>

        {lastUpdated && (
          <p className="mb-4 text-sm text-muted">
            Last updated: {formatClientDate(lastUpdated)}
          </p>
        )}

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
              const elementPosition = searchSectionRef.current.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.scrollY - headerOffset;
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }}
        />
      </div>

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

      <ValuesItemsGrid
        items={sortedItems}
        favorites={favorites}
        onFavoriteChange={(itemId, isFavorited) => {
          setFavorites((prev) =>
            isFavorited
              ? [...prev, itemId]
              : prev.filter((id) => id !== itemId)
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
        }}
        filterSort={filterSort}
        valueSort={valueSort}
        debouncedSearchTerm={debouncedSearchTerm}
      />

    </>
  );
}

// Format the date client-side in the user's local timezone
function formatClientDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  
  // Format date and time separately to avoid locale-specific "at" duplication
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Remove comma after weekday and combine with "at"
  return dateStr.replace(',', '') + ' at ' + timeStr;
}   