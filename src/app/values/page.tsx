"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowUpIcon,
  ShareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from '@mui/material';
import ItemCard from "@/components/Items/ItemCard";
import ItemCardSkeleton from "@/components/Items/ItemCardSkeleton";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Item, FilterSort, ValueSort } from "@/types";
import { sortAndFilterItems } from "@/utils/values";
import toast from 'react-hot-toast';
import { fetchItems, fetchLastUpdated } from '@/utils/api';
import SearchParamsHandler from "@/components/SearchParamsHandler";
import CategoryIcons from "@/components/Items/CategoryIcons";
import { PROD_API_URL } from "@/services/api";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { demandOrder } from "@/utils/values";

export default function ValuesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [sortedItems, setSortedItems] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 24;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
      const response = await fetch(`${PROD_API_URL}/items/random`);
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

  const handleShareClick = () => {
    const params = new URLSearchParams();
    if (filterSort !== "name-all-items") {
      params.set('filterSort', filterSort);
    }
    if (valueSort !== "cash-desc") {
      params.set('valueSort', valueSort);
    }
    
    const shareUrl = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!', {
      duration: 3000,
      position: 'bottom-right',
    });
  };

  const handleCategorySelect = (filter: FilterSort) => {
    setFilterSort(filter);
    localStorage.setItem('valuesFilterSort', filter);
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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemsData = await fetchItems();
      setItems(itemsData);
      const lastUpdatedData = await fetchLastUpdated(itemsData);
      setLastUpdated(lastUpdatedData);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const response = await fetch(`${PROD_API_URL}/favorites/get?user=${userData.id}`);
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const displayedItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
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

  return (
    <main className="min-h-screen bg-[#2E3944] mb-8">
      <Suspense fallback={null}>
        <SearchParamsHandler 
          setFilterSort={setFilterSort} 
          setValueSort={setValueSort} 
        />
      </Suspense>
      
      <div className="container mx-auto px-4">
        <Breadcrumb />
        
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
              Last updated: {lastUpdated}
            </p>
          )}

          <CategoryIcons 
            onSelect={handleCategorySelect} 
            selectedFilter={filterSort} 
            onValueSort={setValueSort}
          />

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
                    return 'bg-red-500/80';
                  case 'Low':
                    return 'bg-orange-500/80';
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

              return (
                <div key={demand} className="flex items-center gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${getDemandColor(demand)}`}></span>
                  <span className="text-sm text-white">{demand}</span>
                </div>
              );
            })}
          </div>
          <p className="mb-4 text-sm text-muted">
            <strong>Note:</strong> Demand levels are ranked from lowest to highest. Items with higher demand are generally easier to trade and may have better values.
          </p>
        </div>

        <div ref={searchSectionRef} className="mb-8 flex flex-col gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Search ${filterSort === "name-all-items" ? "items" : filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ").toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-muted placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filterSort}
              onChange={(e) => {
                const newValue = e.target.value as FilterSort;
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
              className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-muted focus:border-[#124E66] focus:outline-none"
            >
              <option value="name-all-items">All Items</option>
              <option value="favorites">My Favorites</option>
              <option value="name-limited-items">Limited Items</option>
              <option value="name-seasonal-items">Seasonal Items</option>
              <option value="name-vehicles">Vehicles</option>
              <option value="name-spoilers">Spoilers</option>
              <option value="name-rims">Rims</option>
              <option value="name-body-colors">Body Colors</option>
              <option value="name-hyperchromes">HyperChromes</option>
              <option value="name-textures">Body Textures</option>
              <option value="name-tire-stickers">Tire Stickers</option>
              <option value="name-tire-styles">Tire Styles</option>
              <option value="name-drifts">Drifts</option>
              <option value="name-furnitures">Furniture</option>
              <option value="name-horns">Horns</option>
              <option value="name-weapon-skins">Weapon Skins</option>
            </select>

            <select
              value={valueSort}
              onChange={(e) => {
                const newValue = e.target.value as ValueSort;
                setValueSort(newValue);
                localStorage.setItem('valuesValueSort', newValue);
              }}
              className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-muted focus:border-[#124E66] focus:outline-none"
            >
              <optgroup label="Display">
                <option value="random">Random</option>
              </optgroup>
              <optgroup label="Alphabetically">
                <option value="alpha-asc">Name (A to Z)</option>
                <option value="alpha-desc">Name (Z to A)</option>
              </optgroup>
              <optgroup label="Values">
                <option value="cash-desc">Cash Value (High to Low)</option>
                <option value="cash-asc">Cash Value (Low to High)</option>
                <option value="duped-desc">Duped Value (High to Low)</option>
                <option value="duped-asc">Duped Value (Low to High)</option>
              </optgroup>
              <optgroup label="Demand">
                <option value="demand-desc">Demand (High to Low)</option>
                <option value="demand-asc">Demand (Low to High)</option>
              </optgroup>
              <optgroup label="Last Updated">
                <option value="last-updated-desc">
                  Last Updated (Newest to Oldest)
                </option>
                <option value="last-updated-asc">
                  Last Updated (Oldest to Newest)
                </option>
              </optgroup>
            </select>

            <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2">
              <button
                onClick={() => {
                  setFilterSort("name-all-items");
                  setValueSort("cash-desc");
                  localStorage.setItem('valuesFilterSort', "name-all-items");
                  localStorage.setItem('valuesValueSort', "cash-desc");
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-muted hover:bg-[#124E66] focus:outline-none"
              >
                <XMarkIcon className="h-5 w-5" />
                Clear Filters
              </button>

              <button
                onClick={handleShareClick}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-muted hover:bg-[#124E66] focus:outline-none"
              >
                <ShareIcon className="h-5 w-5" />
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <p className="text-muted">
            {debouncedSearchTerm 
              ? `Found ${sortedItems.length} ${sortedItems.length === 1 ? 'item' : 'items'} matching "${debouncedSearchTerm}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
              : `Total ${filterSort !== "name-all-items" ? filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ") : "Items"}: ${sortedItems.length}`
            }
          </p>
          {!loading && totalPages > 1 && (
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

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-4 text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {loading ? (
            [...Array(24)].map((_, i) => <ItemCardSkeleton key={i} />)
          ) : displayedItems.length === 0 ? (
            <div className="col-span-full mb-4 rounded-lg bg-[#37424D] p-8 text-center">
              <p className="text-lg text-muted">
                {debouncedSearchTerm 
                  ? `No items found matching "${debouncedSearchTerm}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
                  : `No items found${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
                }
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
            displayedItems.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                isFavorited={favorites.includes(item.id)}
                onFavoriteChange={(isFavorited) => {
                  if (isFavorited) {
                    setFavorites(prev => [...prev, item.id]);
                  } else {
                    setFavorites(prev => prev.filter(id => id !== item.id));
                  }
                }}
              />
            ))
          )}
        </div>

        {!loading && totalPages > 1 && (
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
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full bg-[#124E66] p-3 text-muted shadow-lg hover:bg-[#1A5F7A] focus:outline-none z-[2000]"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
      )}
    </main>
  );
}
