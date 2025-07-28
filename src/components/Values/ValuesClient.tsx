"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { use } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowUpIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from '@mui/material';
import ItemCard from "@/components/Items/ItemCard";
import { Item, FilterSort, ValueSort } from "@/types";
import { sortAndFilterItems } from "@/utils/values";
import toast from 'react-hot-toast';
import SearchParamsHandler from "@/components/SearchParamsHandler";
import CategoryIcons from "@/components/Items/CategoryIcons";
import { PUBLIC_API_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { demandOrder } from "@/utils/values";
import dynamic from 'next/dynamic';
import DisplayAd from "@/components/Ads/DisplayAd";
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import React from "react";

const Select = dynamic(() => import('react-select'), { ssr: false });

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
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortedItems, setSortedItems] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectLoaded, setSelectLoaded] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 24;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);

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

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handleRandomItem = async () => {
    try {
      const loadingToast = toast.loading('Finding a random item...');
      const response = await fetch(`${PUBLIC_API_URL}/items/random`);
      if (!response.ok) throw new Error('Failed to fetch random item');
      const item = await response.json();
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

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const response = await fetch(`${PUBLIC_API_URL}/favorites/get?user=${userData.id}`);
          if (response.ok) {
            const favoritesData = await response.json();
            if (Array.isArray(favoritesData)) {
              // Extract parent IDs from favorites (take first part before hyphen if exists)
              const favoriteIds = favoritesData.map(fav => {
                const itemId = String(fav.item_id);
                return itemId.includes('-') ? Number(itemId.split('-')[0]) : Number(itemId);
              });
              setFavorites(favoriteIds);
            }
          }
        } catch (err) {
          console.error('Error loading favorites:', err);
        }
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    const updateSortedItems = async () => {
      const sorted = await sortAndFilterItems(items, filterSort, valueSort, debouncedSearchTerm);
      setSortedItems(sorted);
    };
    updateSortedItems();
  }, [items, debouncedSearchTerm, filterSort, valueSort]);

  useEffect(() => {
    setPage(1);
  }, [filterSort, valueSort, debouncedSearchTerm]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const adjustedIndexOfLastItem = page * itemsPerPage;
  const adjustedIndexOfFirstItem = adjustedIndexOfLastItem - itemsPerPage;
  const displayedItems = sortedItems.slice(adjustedIndexOfFirstItem, adjustedIndexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getNoItemsMessage = () => {
    const hasCategoryFilter = filterSort !== "name-all-items";
    const hasDemandFilter = valueSort.startsWith('demand-') && valueSort !== 'demand-desc' && valueSort !== 'demand-asc';
    const hasSearchTerm = debouncedSearchTerm;
    
    let message = "No items found";
    
    // Build the message based on what filters are applied
    if (hasSearchTerm) {
      message += ` matching "${debouncedSearchTerm}"`;
    }
    
    if (hasCategoryFilter && hasDemandFilter) {
      const categoryName = filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ");
      const demandLevel = valueSort.replace('demand-', '').replace(/-/g, ' ');
      const formattedDemand = demandLevel.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      message += ` in ${categoryName} with ${formattedDemand} demand`;
    } else if (hasCategoryFilter) {
      const categoryName = filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ");
      message += ` in ${categoryName}`;
    } else if (hasDemandFilter) {
      const demandLevel = valueSort.replace('demand-', '').replace(/-/g, ' ');
      const formattedDemand = demandLevel.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      message += ` with ${formattedDemand} demand`;
    }
    
    return message;
  };

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

        {/* Trader Notes, Demand Levels Guide, and YouTube Video */}
        <div className="mt-8 pt-8 border-t border-[#2E3944] flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <h3 className="mb-2 text-xl font-semibold text-muted">
              Trader Notes
            </h3>
            <ul className="mb-4 list-inside list-disc space-y-2 text-muted">
              <li>This is NOT an official list, it is 100% community based</li>
              <li>
                Some values may be outdated but we do our best to make sure it&apos;s
                accurate as possible
              </li>
              <li>
                Please don&apos;t 100% rely on the value list, use your own judgment as
                well
              </li>
            </ul>
            <h3 className="mb-2 text-xl font-semibold text-muted">
              Demand Levels Guide
            </h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {demandOrder.map((demand) => {
                const getDemandColor = (demand: string): string => {
                  switch(demand) {
                    case 'Close to none':
                      return 'bg-gray-500/80';
                    case 'Very Low':
                      return 'bg-orange-500/80';
                    case 'Low':
                      return 'bg-orange-400/80';
                    case 'Medium':
                      return 'bg-yellow-500/80';
                    case 'Decent':
                      return 'bg-green-500/80';
                    case 'High':
                      return 'bg-blue-500/80';
                    case 'Very High':
                      return 'bg-purple-500/80';
                    case 'Extremely High':
                      return 'bg-pink-500/80';
                    default:
                      return 'bg-gray-500/80';
                  }
                };
                const getDemandValue = (demand: string): string => {
                  switch(demand) {
                    case 'Close to none':
                      return 'demand-close-to-none';
                    case 'Very Low':
                      return 'demand-very-low';
                    case 'Low':
                      return 'demand-low';
                    case 'Medium':
                      return 'demand-medium';
                    case 'Decent':
                      return 'demand-decent';
                    case 'High':
                      return 'demand-high';
                    case 'Very High':
                      return 'demand-very-high';
                    case 'Extremely High':
                      return 'demand-extremely-high';
                    default:
                      return 'demand-close-to-none';
                  }
                };
                return (
                  <button
                    key={demand}
                    onClick={() => {
                      const demandValue = getDemandValue(demand);
                      if (valueSort === demandValue) {
                        setValueSort("cash-desc");
                        localStorage.setItem('valuesValueSort', "cash-desc");
                      } else {
                        setValueSort(demandValue as ValueSort);
                        localStorage.setItem('valuesValueSort', demandValue);
                      }
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
                    className={`flex items-center gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5 transition-all hover:scale-105 focus:outline-none ${
                      valueSort === getDemandValue(demand) ? 'ring-2 ring-[#5865F2]' : ''
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full ${getDemandColor(demand)}`}></span>
                    <span className="text-sm text-white">{demand}</span>
                  </button>
                );
              })}
            </div>
            <p className="mb-4 text-sm text-muted">
              <strong>Note:</strong> Demand levels are ranked from lowest to highest. Items with higher demand are generally easier to trade and may have better values.<br/>
              Not all demand levels are currently in use; some may not be represented among items.
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <iframe
              src="https://www.youtube.com/embed/yEsTOaJka3k"
              width="100%"
              height="315"
              allowFullScreen
              loading="lazy"
              title="Jailbreak Trading Video"
              style={{ border: 0, borderRadius: '20px', maxWidth: 560, width: '100%', height: 315 }}
            />
          </div>
        </div>
      </div>

      <div ref={searchSectionRef} className="mb-8">
        <div
          className={
            !premiumStatusLoaded
              ? "flex flex-col lg:flex-row gap-6 items-start"
              : currentUserPremiumType !== 0
                ? "flex flex-col lg:flex-row gap-4 items-start"
                : "flex flex-col lg:flex-row gap-6 items-start"
          }
        >
          {/* Controls: horizontal row for premium, vertical stack for non-premium */}
          <div
            className={
              !premiumStatusLoaded
                ? "w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4"
                : currentUserPremiumType !== 0
                  ? "w-full flex flex-col lg:flex-row lg:items-center lg:gap-4"
                  : "w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4"
            }
          >
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${filterSort === "name-all-items" ? "items" : filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ").toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-[380px] xl:w-[480px] rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-muted placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF] hover:text-muted"
                  aria-label="Clear search"
                >
                  <XMarkIcon />
                </button>
              )}
            </div>
            {/* Filter dropdown */}
            {selectLoaded ? (
              <Select
                value={{ value: filterSort, label: (() => {
                  switch (filterSort) {
                    case 'name-all-items': return 'All Items';
                    case 'favorites': return 'My Favorites';
                    case 'name-limited-items': return 'Limited Items';
                    case 'name-seasonal-items': return 'Seasonal Items';
                    case 'name-vehicles': return 'Vehicles';
                    case 'name-spoilers': return 'Spoilers';
                    case 'name-rims': return 'Rims';
                    case 'name-body-colors': return 'Body Colors';
                    case 'name-hyperchromes': return 'HyperChromes';
                    case 'name-textures': return 'Body Textures';
                    case 'name-tire-stickers': return 'Tire Stickers';
                    case 'name-tire-styles': return 'Tire Styles';
                    case 'name-drifts': return 'Drifts';
                    case 'name-furnitures': return 'Furniture';
                    case 'name-horns': return 'Horns';
                    case 'name-weapon-skins': return 'Weapon Skins';
                    default: return filterSort;
                  }
                })() }}
                onChange={(option: unknown) => {
                  if (!option) {
                    // Reset to original value when cleared
                    setFilterSort("name-all-items");
                    localStorage.setItem('valuesFilterSort', "name-all-items");
                    return;
                  }
                  const newValue = (option as { value: FilterSort }).value;
                  if (newValue === "favorites") {
                    const storedUser = localStorage.getItem('user');
                    if (!storedUser) {
                      toast.error('Please log in to view your favorites');
                      return;
                    }
                  }
                  setFilterSort(newValue);
                  localStorage.setItem('valuesFilterSort', newValue);
                }}
                options={[
                  { value: 'name-all-items', label: 'All Items' },
                  { value: 'favorites', label: 'My Favorites' },
                  { value: 'name-limited-items', label: 'Limited Items' },
                  { value: 'name-seasonal-items', label: 'Seasonal Items' },
                  { value: 'name-vehicles', label: 'Vehicles' },
                  { value: 'name-spoilers', label: 'Spoilers' },
                  { value: 'name-rims', label: 'Rims' },
                  { value: 'name-body-colors', label: 'Body Colors' },
                  { value: 'name-hyperchromes', label: 'HyperChromes' },
                  { value: 'name-textures', label: 'Body Textures' },
                  { value: 'name-tire-stickers', label: 'Tire Stickers' },
                  { value: 'name-tire-styles', label: 'Tire Styles' },
                  { value: 'name-drifts', label: 'Drifts' },
                  { value: 'name-furnitures', label: 'Furniture' },
                  { value: 'name-horns', label: 'Horns' },
                  { value: 'name-weapon-skins', label: 'Weapon Skins' },
                ]}
                classNamePrefix="react-select"
                className="w-full"
                isClearable={true}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#37424D',
                    borderColor: '#2E3944',
                    color: '#D3D9D4',
                  }),
                  singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
                  menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#5865F2' : state.isFocused ? '#2E3944' : '#37424D',
                    color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                    '&:active': {
                      backgroundColor: '#124E66',
                      color: '#FFFFFF',
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: '#D3D9D4',
                    '&:hover': {
                      color: '#FFFFFF',
                    },
                  }),
                }}
                isSearchable={false}
              />
            ) : (
              <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-md animate-pulse"></div>
            )}
            {/* Sort dropdown */}
            {selectLoaded ? (
              <Select
                value={{ value: valueSort, label: (() => {
                  switch (valueSort) {
                    case 'random': return 'Random';
                    case 'alpha-asc': return 'Name (A to Z)';
                    case 'alpha-desc': return 'Name (Z to A)';
                    case 'cash-desc': return 'Cash Value (High to Low)';
                    case 'cash-asc': return 'Cash Value (Low to High)';
                    case 'duped-desc': return 'Duped Value (High to Low)';
                    case 'duped-asc': return 'Duped Value (Low to High)';
                    case 'demand-desc': return 'Demand (High to Low)';
                    case 'demand-asc': return 'Demand (Low to High)';
                    case 'demand-extremely-high': return 'Extremely High Demand';
                    case 'demand-very-high': return 'Very High Demand';
                    case 'demand-high': return 'High Demand';
                    case 'demand-decent': return 'Decent Demand';
                    case 'demand-medium': return 'Medium Demand';
                    case 'demand-low': return 'Low Demand';
                    case 'demand-very-low': return 'Very Low Demand';
                    case 'demand-close-to-none': return 'Close to None';
                    case 'last-updated-desc': return 'Last Updated (Newest to Oldest)';
                    case 'last-updated-asc': return 'Last Updated (Oldest to Newest)';
                    default: return valueSort;
                  }
                })() }}
                onChange={(option: unknown) => {
                  if (!option) {
                    // Reset to original value when cleared
                    setValueSort("cash-desc");
                    localStorage.setItem('valuesValueSort', "cash-desc");
                    return;
                  }
                  const newValue = (option as { value: ValueSort }).value;
                  setValueSort(newValue);
                  localStorage.setItem('valuesValueSort', newValue);
                }}
                options={[
                  { label: 'Display', options: [
                    { value: 'random', label: 'Random' },
                  ]},
                  { label: 'Alphabetically', options: [
                    { value: 'alpha-asc', label: 'Name (A to Z)' },
                    { value: 'alpha-desc', label: 'Name (Z to A)' },
                  ]},
                  { label: 'Values', options: [
                    { value: 'cash-desc', label: 'Cash Value (High to Low)' },
                    { value: 'cash-asc', label: 'Cash Value (Low to High)' },
                    { value: 'duped-desc', label: 'Duped Value (High to Low)' },
                    { value: 'duped-asc', label: 'Duped Value (Low to High)' },
                  ]},
                  { label: 'Demand', options: [
                    { value: 'demand-desc', label: 'Demand (High to Low)' },
                    { value: 'demand-asc', label: 'Demand (Low to High)' },
                    { value: 'demand-extremely-high', label: 'Extremely High Demand' },
                    { value: 'demand-very-high', label: 'Very High Demand' },
                    { value: 'demand-high', label: 'High Demand' },
                    { value: 'demand-decent', label: 'Decent Demand' },
                    { value: 'demand-medium', label: 'Medium Demand' },
                    { value: 'demand-low', label: 'Low Demand' },
                    { value: 'demand-very-low', label: 'Very Low Demand' },
                    { value: 'demand-close-to-none', label: 'Close to None' },
                  ]},
                  { label: 'Last Updated', options: [
                    { value: 'last-updated-desc', label: 'Last Updated (Newest to Oldest)' },
                    { value: 'last-updated-asc', label: 'Last Updated (Oldest to Newest)' },
                  ]},
                ]}
                classNamePrefix="react-select"
                className="w-full"
                isClearable={true}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#37424D',
                    borderColor: '#2E3944',
                    color: '#D3D9D4',
                  }),
                  singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
                  menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#5865F2' : state.isFocused ? '#2E3944' : '#37424D',
                    color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                    '&:active': {
                      backgroundColor: '#124E66',
                      color: '#FFFFFF',
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: '#D3D9D4',
                    '&:hover': {
                      color: '#FFFFFF',
                    },
                  }),
                }}
                isSearchable={false}
              />
            ) : (
              <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-md animate-pulse"></div>
            )}
          </div>
          {/* Right: Ad */}
          {premiumStatusLoaded && currentUserPremiumType === 0 && (
            <div className="w-full max-w-[480px] lg:w-[480px] lg:flex-shrink-0 bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative mt-4 lg:mt-0" style={{ minHeight: '250px' }}>
              <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-[#212A31] px-2 py-0.5 rounded z-10">
                Advertisement
              </span>
              <DisplayAd
                adSlot="8162235433"
                adFormat="auto"
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4">
        <p className="text-muted">
          {debouncedSearchTerm 
            ? `Found ${sortedItems.length} ${sortedItems.length === 1 ? 'item' : 'items'} matching "${debouncedSearchTerm}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
            : `Total ${filterSort !== "name-all-items" ? filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ") : "Items"}: ${sortedItems.length}`
          }
        </p>
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#D3D9D4',
                  '&.Mui-selected': {
                    backgroundColor: '#5865F2',
                    '&:hover': {
                      backgroundColor: '#4752C4',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#2E3944',
                  },
                },
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
        {displayedItems.length === 0 ? (
          <div className="col-span-full mb-4 rounded-lg bg-[#37424D] p-8 text-center">
            <p className="text-lg text-muted">
              {getNoItemsMessage()}
            </p>
            <button
              onClick={() => {
                setFilterSort("name-all-items");
                setValueSort("cash-desc");
                setSearchTerm("");
              }}
              className="mt-4 rounded-lg border border-[#2E3944] bg-[#124E66] px-6 py-2 text-muted hover:bg-[#1A5F7A] focus:outline-none"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          displayedItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ItemCard
                item={item}
                isFavorited={favorites.includes(item.id)}
                onFavoriteChange={(fav) => {
                  setFavorites((prev) =>
                    fav
                      ? [...prev, item.id]
                      : prev.filter((id) => id !== item.id)
                  );
                }}
              />
              {/* Show in-feed ad after every 12 items */}
              {premiumStatusLoaded && currentUserPremiumType === 0 && (index + 1) % 12 === 0 && (index + 1) < displayedItems.length && (
                <div className="col-span-full my-4">
                  <div className="bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative" style={{ minHeight: '450px', maxHeight: '500px' }}>
                    <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-[#212A31] px-2 py-0.5 rounded z-10">
                      Advertisement
                    </span>
                    <DisplayAd
                      adSlot="4358721799"
                      adFormat="fluid"
                      layoutKey="-62+ck+1k-2e+cb"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#D3D9D4',
                '&.Mui-selected': {
                  backgroundColor: '#5865F2',
                  '&:hover': {
                    backgroundColor: '#4752C4',
                  },
                },
                '&:hover': {
                  backgroundColor: '#2E3944',
                },
              },
            }}
          />
        </div>
      )}

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full bg-[#124E66] p-3 text-muted shadow-lg hover:bg-[#1A5F7A] focus:outline-none z-[2000]"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
      )}
    </>
  );
} 

// Format the date client-side in the user's local timezone
function formatClientDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  // Example: Tuesday, July 15, 2025 at 11:21 PM
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', '') // Remove comma after weekday for a more natural look
    .replace(/ (\d{1,2}):(\d{2}) ([AP]M)/, ' at $1:$2 $3');
} 