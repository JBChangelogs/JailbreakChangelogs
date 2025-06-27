import React, { useState, useEffect } from 'react';
import { PROD_API_URL } from '@/services/api';
import { TradeItem } from '@/types/trading';
import { Pagination, Skeleton, Checkbox, FormControlLabel } from '@mui/material';
import { getToken } from '@/utils/auth';
import toast from 'react-hot-toast';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { sortByCashValue, sortByDemand } from '@/utils/values';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { getItemTypeColor } from '@/utils/badgeColors';
import { TradeAdErrorModal } from './TradeAdErrorModal';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { FilterSort, ValueSort } from '@/types';

interface AvailableItemsGridProps {
  onSelect: (item: TradeItem, side: 'offering' | 'requesting') => boolean;
  selectedItems: TradeItem[];
  onCreateTradeAd?: () => void;
  requireAuth?: boolean;
}

const AvailableItemsGrid: React.FC<AvailableItemsGridProps> = ({
  onSelect,
  requireAuth = false,
}) => {
  const [availableItems, setAvailableItems] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");
  const [showNonTradable, setShowNonTradable] = useState(false);
  const ITEMS_PER_PAGE = 18;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (requireAuth && !token) return;

        const response = await fetch(`${PROD_API_URL}/items/list`);
        if (response.ok) {
          const data = await response.json();
          setAvailableItems(data);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
        toast.error('Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [requireAuth]);

  useEffect(() => {
    const handleShowError = (event: CustomEvent) => {
      setValidationErrors(event.detail.errors);
      setShowErrorModal(true);
    };

    const element = document.querySelector('[data-component="available-items-grid"]');
    element?.addEventListener('showTradeAdError', handleShowError as EventListener);

    return () => {
      element?.removeEventListener('showTradeAdError', handleShowError as EventListener);
    };
  }, []);

  const filteredItems = availableItems.filter(item => {
    // First apply search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Then apply tradable filter
    if (!showNonTradable && item.tradable !== 1) return false;

    // Then apply category filter
    switch (filterSort) {
      case "name-limited-items":
        return item.is_limited === 1;
      case "name-seasonal-items":
        return item.is_seasonal === 1;
      case "name-vehicles":
        return item.type.toLowerCase() === "vehicle";
      case "name-spoilers":
        return item.type.toLowerCase() === "spoiler";
      case "name-rims":
        return item.type.toLowerCase() === "rim";
      case "name-body-colors":
        return item.type.toLowerCase() === "body color";
      case "name-hyperchromes":
        return item.type.toLowerCase() === "hyperchrome";
      case "name-textures":
        return item.type.toLowerCase() === "texture";
      case "name-tire-stickers":
        return item.type.toLowerCase() === "tire sticker";
      case "name-tire-styles":
        return item.type.toLowerCase() === "tire style";
      case "name-drifts":
        return item.type.toLowerCase() === "drift";
      case "name-furnitures":
        return item.type.toLowerCase() === "furniture";
      case "name-horns":
        return item.type.toLowerCase() === "horn";
      case "name-weapon-skins":
        return item.type.toLowerCase() === "weapon skin";
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (valueSort) {
      case "cash-desc":
        return sortByCashValue(a.cash_value, b.cash_value, 'desc');
      case "cash-asc":
        return sortByCashValue(a.cash_value, b.cash_value, 'asc');
      case "duped-desc":
        return sortByCashValue(a.duped_value, b.duped_value, 'desc');
      case "duped-asc":
        return sortByCashValue(a.duped_value, b.duped_value, 'asc');
      case "demand-desc":
        return sortByDemand(a.demand || 'Close to none', b.demand || 'Close to none', 'desc');
      case "demand-asc":
        return sortByDemand(a.demand || 'Close to none', b.demand || 'Close to none', 'asc');
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleVariantSelect = (itemId: number, variant: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [itemId]: variant
    }));
  };

  const handleAddItem = (item: TradeItem, side: 'offering' | 'requesting') => {
    const selectedVariant = selectedVariants[item.id];
    let itemToAdd = { ...item, side };

    if (selectedVariant && selectedVariant !== '2025') {
      // If a specific variant is selected, use its values
      const selectedChild = item.children?.find(child => child.sub_name === selectedVariant);
      if (selectedChild) {
        itemToAdd = {
          ...item,
          cash_value: selectedChild.data.cash_value,
          duped_value: selectedChild.data.duped_value,
          demand: selectedChild.data.demand,
          sub_name: selectedVariant,
          base_name: item.name,
          side
        };
      }
    } else {
      // For 2025 or no variant selected, use parent item values
      itemToAdd = {
        ...item,
        sub_name: undefined,
        base_name: item.name,
        side
      };
    }

    const addedSuccessfully = onSelect(itemToAdd, side);
    if (addedSuccessfully) {
      const itemName = itemToAdd.sub_name ? `${itemToAdd.name} (${itemToAdd.sub_name})` : itemToAdd.name;
      toast.success(`Added ${itemName} to ${side} items`);
    }
  };

  return (
    <div className="space-y-4" data-component="available-items-grid">
      <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-muted font-medium">Tradable Items</h3>
        </div>

        <div className="mb-4 relative">
          <div className="relative">
            <SearchIcon 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted/50"
              sx={{ fontSize: 20 }}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-[#2E3944] border border-[#37424D] rounded-lg text-muted placeholder-[#D3D9D4]/50 focus:outline-none focus:border-[#5865F2]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFFFFF] hover:text-muted transition-colors"
                aria-label="Clear search"
              >
                <ClearIcon sx={{ fontSize: 20 }} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <select
            value={filterSort}
            onChange={(e) => {
              const newValue = e.target.value as FilterSort;
              setFilterSort(newValue);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-muted focus:border-[#124E66] focus:outline-none"
          >
            <option value="name-all-items">All Items</option>
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
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 text-muted focus:border-[#124E66] focus:outline-none"
          >
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
          </select>

          <FormControlLabel
            control={
              <Checkbox
                checked={showNonTradable}
                onChange={(e) => {
                  setShowNonTradable(e.target.checked);
                  setPage(1);
                }}
                sx={{
                  color: '#D3D9D4',
                  '&.Mui-checked': {
                    color: '#5865F2',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 20,
                  },
                }}
              />
            }
            label="Show Non-Tradable Items"
            sx={{
              color: '#D3D9D4',
              '& .MuiFormControlLabel-label': {
                fontSize: '0.875rem',
              },
            }}
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* Search Bar Skeleton */}
            <div className="relative">
              <Skeleton variant="rectangular" width="100%" height={40} className="rounded-lg" />
            </div>

            {/* Items Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#2E3944]">
                  {/* Item Image Skeleton */}
                  <Skeleton variant="rectangular" width="100%" height={120} className="rounded-md mb-2" />
                  
                  {/* Item Name Skeleton */}
                  <Skeleton variant="text" width="80%" height={20} className="mb-2" />
                  
                  {/* Item Type and Badges Skeleton */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
                    <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
                  </div>
                  
                  {/* Item Values Skeleton */}
                  <div className="space-y-1 mb-2">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={16} />
                    <Skeleton variant="text" width="50%" height={16} />
                  </div>
                  
                  {/* Action Buttons Skeleton */}
                  <div className="flex gap-2">
                    <Skeleton variant="rectangular" width="50%" height={24} className="rounded-md" />
                    <Skeleton variant="rectangular" width="50%" height={24} className="rounded-md" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center mt-4">
              <Skeleton variant="rectangular" width={200} height={32} className="rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="col-span-full mb-4 rounded-lg bg-[#37424D] p-8 text-center">
                <p className="text-lg text-muted">
                  {searchQuery 
                    ? `No items found matching "${searchQuery}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
                    : `No items found${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterSort("name-all-items");
                    setValueSort("cash-desc");
                  }}
                  className="mt-4 rounded-lg border border-[#2E3944] bg-[#124E66] px-6 py-2 text-muted hover:bg-[#1A5F7A] focus:outline-none"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {paginatedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg transition-colors text-left w-full flex flex-col ${
                      item.tradable === 1 
                        ? 'bg-[#2E3944] hover:bg-[#37424D]'
                        : 'bg-[#2E3944] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="aspect-[4/3] relative rounded-md overflow-hidden mb-2">
                      {isVideoItem(item.name) ? (
                        <video
                          src={getVideoPath(item.type, item.name)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : (
                        <Image
                          src={getItemImagePath(item.type, item.name, true)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                          unoptimized
                          fill
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-grow">
                      <div className="space-y-1.5">
                        <p className="text-muted text-sm font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full text-white"
                            style={{ backgroundColor: getItemTypeColor(item.type) }}
                          >
                            {item.type}
                          </span>
                          {item.is_limited === 1 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                              Limited
                            </span>
                          )}
                          {item.tradable !== 1 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                              Not Tradable
                            </span>
                          )}
                        </div>
                        {item.tradable === 1 && (
                          <>
                            <div className="text-xs text-muted space-y-1">
                              <div>Cash: {selectedVariants[item.id] && selectedVariants[item.id] !== '2025' ? 
                                (item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.cash_value === null || 
                                item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.cash_value === "N/A" ? "N/A" :
                                item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.cash_value)
                                : (item.cash_value === null || item.cash_value === "N/A" ? "N/A" : item.cash_value)}</div>
                              <div>Duped: {selectedVariants[item.id] && selectedVariants[item.id] !== '2025' ? 
                                (item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.duped_value === null || 
                                item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.duped_value === "N/A" ? "N/A" :
                                item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.duped_value)
                                : (item.duped_value === null || item.duped_value === "N/A" ? "N/A" : item.duped_value)}</div>
                              {item.demand && (
                                <div>Demand: {selectedVariants[item.id] && selectedVariants[item.id] !== '2025' ? 
                                  item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.demand 
                                  : item.demand}</div>
                              )}
                            </div>
                            {item.children && item.children.length > 0 && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                                    dropdown?.classList.toggle('hidden');
                                  }}
                                  className="w-full flex items-center justify-between gap-1 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5 text-sm text-muted hover:bg-[#124E66] focus:outline-none"
                                >
                                  {selectedVariants[item.id] || '2025'}
                                  <ChevronDownIcon className="h-4 w-4" />
                                </button>
                                <div className="absolute z-10 mt-1 w-full hidden rounded-lg border border-[#2E3944] bg-[#37424D] shadow-lg">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVariantSelect(item.id, '2025');
                                      (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-muted hover:bg-[#124E66]"
                                  >
                                    2025
                                  </button>
                                  {item.children.map((child) => (
                                    <button
                                      key={child.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVariantSelect(item.id, child.sub_name);
                                        (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-muted hover:bg-[#124E66]"
                                    >
                                      {child.sub_name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {item.tradable === 1 && (
                        <div className="flex gap-2 mt-auto pt-2">
                          <button
                            onClick={() => handleAddItem(item, 'offering')}
                            className="flex-1 py-1 px-2 text-xs rounded-md transition-colors bg-[#5865F2] hover:bg-[#4752C4] text-white"
                          >
                            Offer
                          </button>
                          <button
                            onClick={() => handleAddItem(item, 'requesting')}
                            className="flex-1 py-1 px-2 text-xs rounded-md transition-colors bg-[#5865F2] hover:bg-[#4752C4] text-white"
                          >
                            Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && totalPages > 1 && filteredItems.length > 0 && (
              <div className="flex justify-center mt-4">
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
                        backgroundColor: '#37424D',
                      },
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <TradeAdErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </div>
  );
};

export { AvailableItemsGrid };
export type { AvailableItemsGridProps }; 