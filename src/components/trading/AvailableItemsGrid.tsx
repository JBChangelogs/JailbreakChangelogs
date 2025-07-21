import React, { useState, useEffect } from 'react';
import { TradeItem } from '@/types/trading';
import { Pagination, Checkbox, FormControlLabel } from '@mui/material';
import toast from 'react-hot-toast';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { sortByCashValue, sortByDemand, formatFullValue } from '@/utils/values';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { getItemTypeColor } from '@/utils/badgeColors';
import { CategoryIconBadge } from '@/utils/categoryIcons';
import { TradeAdErrorModal } from './TradeAdErrorModal';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { FilterSort, ValueSort } from '@/types';
import dynamic from 'next/dynamic';
import DisplayAd from '@/components/Ads/DisplayAd';
import { useDebounce } from '@/hooks/useDebounce';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface AvailableItemsGridProps {
  items: TradeItem[];
  onSelect: (item: TradeItem, side: 'offering' | 'requesting') => boolean;
  selectedItems: TradeItem[];
  onCreateTradeAd?: () => void;
  requireAuth?: boolean;
}

const AvailableItemsGrid: React.FC<AvailableItemsGridProps> = ({
  items,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");
  const [showNonTradable, setShowNonTradable] = useState(false);
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const router = useRouter();
  const ITEMS_PER_PAGE = 18;
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

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

  const filteredItems = items.filter(item => {
    // First apply search filter
    const matchesSearch = item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         item.type.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
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

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

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

        {/* Ad Placement: Above the grid, only for non-premium users */}
        {premiumStatusLoaded && currentUserPremiumType === 0 && (
          <div className="flex justify-center w-full mb-6">
            <div className="w-full max-w-[700px] bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative" style={{ minHeight: '250px' }}>
              <span className="absolute top-2 left-2 text-xs text-muted bg-[#212A31] px-2 py-0.5 rounded z-10">
                Advertisement
              </span>
              <DisplayAd
                adSlot="4222990422"
                adFormat="auto"
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </div>
          </div>
        )}

        <div className="mb-4 relative">
          <div className="relative">
            <SearchIcon 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted/50"
              sx={{ fontSize: 20 }}
            />
            <input
              type="text"
              placeholder="Search items by name or type..."
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
          {debouncedSearchQuery && (
            <div className="mt-2 text-sm text-muted">
              Found {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} matching &quot;{debouncedSearchQuery}&quot;
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          {selectLoaded ? (
            <Select
              value={{ value: filterSort, label: (() => {
                switch (filterSort) {
                  case 'name-all-items': return 'All Items';
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
                  setPage(1);
                  return;
                }
                const newValue = (option as { value: FilterSort }).value;
                setFilterSort(newValue);
                setPage(1);
              }}
              options={[
                { value: 'name-all-items', label: 'All Items' },
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

          {selectLoaded ? (
            <Select
              value={{ value: valueSort, label: (() => {
                switch (valueSort) {
                  case 'cash-desc': return 'Cash Value (High to Low)';
                  case 'cash-asc': return 'Cash Value (Low to High)';
                  case 'duped-desc': return 'Duped Value (High to Low)';
                  case 'duped-asc': return 'Duped Value (Low to High)';
                  case 'demand-desc': return 'Demand (High to Low)';
                  case 'demand-asc': return 'Demand (Low to High)';
                  default: return valueSort;
                }
              })() }}
              onChange={(option: unknown) => {
                if (!option) {
                  // Reset to original value when cleared
                  setValueSort("cash-desc");
                  setPage(1);
                  return;
                }
                const newValue = (option as { value: ValueSort }).value;
                setValueSort(newValue);
                setPage(1);
              }}
              options={[
                { label: 'Values', options: [
                  { value: 'cash-desc', label: 'Cash Value (High to Low)' },
                  { value: 'cash-asc', label: 'Cash Value (Low to High)' },
                  { value: 'duped-desc', label: 'Duped Value (High to Low)' },
                  { value: 'duped-asc', label: 'Duped Value (Low to High)' },
                ]},
                { label: 'Demand', options: [
                  { value: 'demand-desc', label: 'Demand (High to Low)' },
                  { value: 'demand-asc', label: 'Demand (Low to High)' },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {paginatedItems.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted">
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
            paginatedItems.map((item) => (
              <div
                key={item.id}
                className={`group p-2 rounded-lg transition-colors text-left w-full flex flex-col ${
                  item.tradable === 1 
                    ? 'bg-[#2E3944] hover:bg-[#37424D]'
                    : 'bg-[#2E3944] opacity-50 cursor-not-allowed'
                }`}
                tabIndex={0}
                role="button"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  // Only navigate if not clicking a button or dropdown
                  if (
                    e.target instanceof HTMLElement &&
                    !e.target.closest('button') &&
                    !e.target.closest('a') &&
                    !e.target.closest('.dropdown')
                  ) {
                    router.push(`/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`);
                  }
                }}
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
                      fill
                    />
                  )}
                  <div className="absolute top-2 right-2 z-5">
                    <CategoryIconBadge
                      type={item.type}
                      isLimited={item.is_limited === 1}
                      isSeasonal={item.is_seasonal === 1}
                      hasChildren={!!item.children?.length}
                      showCategoryForVariants={true}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="space-y-1.5">
                    <span className="text-muted text-sm font-medium truncate transition-colors group-hover:text-blue-400">
                      {item.name}
                    </span>
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
                      {item.is_seasonal === 1 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                          Seasonal
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
                            formatFullValue(item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.cash_value ?? null))
                            : (item.cash_value === null || item.cash_value === "N/A" ? "N/A" : formatFullValue(item.cash_value))}</div>
                          <div>Duped: {selectedVariants[item.id] && selectedVariants[item.id] !== '2025' ? 
                            (item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.duped_value === null || 
                            item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.duped_value === "N/A" ? "N/A" :
                            formatFullValue(item.children?.find(child => child.sub_name === selectedVariants[item.id])?.data.duped_value ?? null))
                            : (item.duped_value === null || item.duped_value === "N/A" ? "N/A" : formatFullValue(item.duped_value))}</div>
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
                                e.preventDefault();
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
                                  e.preventDefault();
                                  handleVariantSelect(item.id, '2025');
                                  (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-muted hover:bg-[#124E66]"
                              >
                                2025
                              </button>
                              {item.children?.map((child) => (
                                <button
                                  key={child.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
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
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleAddItem(item, 'offering');
                        }}
                        className="flex-1 py-1 px-2 text-xs rounded-md transition-colors bg-[#5865F2] hover:bg-[#4752C4] text-white"
                      >
                        Offer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleAddItem(item, 'requesting');
                        }}
                        className="flex-1 py-1 px-2 text-xs rounded-md transition-colors bg-[#5865F2] hover:bg-[#4752C4] text-white"
                      >
                        Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && filteredItems.length > 0 && (
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