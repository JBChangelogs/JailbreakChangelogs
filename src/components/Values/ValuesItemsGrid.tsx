"use client";

import { useState, useEffect } from "react";
import { Pagination } from '@mui/material';
import ItemCard from "@/components/Items/ItemCard";
import { Item } from "@/types";
import { getEffectiveCashValue } from "@/utils/values";
import DisplayAd from "@/components/Ads/DisplayAd";
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import React from "react";

interface ValuesItemsGridProps {
  items: Item[];
  favorites: number[];
  onFavoriteChange: (itemId: number, isFavorited: boolean) => void;
  appliedMinValue: number;
  appliedMaxValue: number;
  MAX_VALUE_RANGE: number;
  onResetValueRange: () => void;
  onClearAllFilters: () => void;
  filterSort: string;
  valueSort: string;
  debouncedSearchTerm: string;
}

export default function ValuesItemsGrid({
  items,
  favorites,
  onFavoriteChange,
  appliedMinValue,
  appliedMaxValue,
  MAX_VALUE_RANGE,
  onResetValueRange,
  onClearAllFilters,
  filterSort,
  valueSort,
  debouncedSearchTerm
}: ValuesItemsGridProps) {
  const [page, setPage] = useState(1);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const itemsPerPage = 24;

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

  useEffect(() => {
    setPage(1);
  }, [filterSort, valueSort, debouncedSearchTerm, appliedMinValue, appliedMaxValue]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const parseNumericValue = (value: string | null): number => {
    if (!value || value === 'N/A') return -1;
    const lower = value.toLowerCase();
    const num = parseFloat(lower.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(num)) return -1;
    if (lower.includes('k')) return num * 1_000;
    if (lower.includes('m')) return num * 1_000_000;
    if (lower.includes('b')) return num * 1_000_000_000;
    return num;
  };

  const rangeFilteredItems = (appliedMinValue === 0 && appliedMaxValue >= MAX_VALUE_RANGE)
    ? items
    : items.filter((item) => {
        const cash = parseNumericValue(getEffectiveCashValue(item));
        const isOpenEndedMax = appliedMaxValue >= MAX_VALUE_RANGE;
        if (isOpenEndedMax) return cash >= appliedMinValue;
        return cash >= appliedMinValue && cash <= appliedMaxValue;
      });

  const adjustedIndexOfLastItem = page * itemsPerPage;
  const adjustedIndexOfFirstItem = adjustedIndexOfLastItem - itemsPerPage;
  const displayedItems = rangeFilteredItems.slice(adjustedIndexOfFirstItem, adjustedIndexOfLastItem);
  const totalPages = Math.ceil(rangeFilteredItems.length / itemsPerPage);

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
      <div className="mb-4 flex flex-col gap-4">
        <p className="text-muted">
          {debouncedSearchTerm 
            ? `Found ${rangeFilteredItems.length} ${rangeFilteredItems.length === 1 ? 'item' : 'items'} matching "${debouncedSearchTerm}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
            : `Total ${filterSort !== "name-all-items" ? filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ") : "Items"}: ${rangeFilteredItems.length}`
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
              {rangeFilteredItems.length === 0 && items.length > 0
                ? `No items found in the selected value range (${appliedMinValue.toLocaleString()} - ${appliedMaxValue >= MAX_VALUE_RANGE ? `${MAX_VALUE_RANGE.toLocaleString()}+` : appliedMaxValue.toLocaleString()})`
                : getNoItemsMessage()}
            </p>
            {rangeFilteredItems.length === 0 && items.length > 0 && (
              <button
                onClick={onResetValueRange}
                className="mt-4 mr-3 rounded-lg border border-[#2E3944] bg-[#124E66] px-6 py-2 text-muted hover:bg-[#1A5F7A] focus:outline-none"
              >
                Reset Value Range
              </button>
            )}
            <button
              onClick={onClearAllFilters}
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
                  onFavoriteChange(item.id, fav);
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
    </>
  );
}
