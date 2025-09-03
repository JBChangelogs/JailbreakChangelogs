"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FilterSort, ValueSort } from "@/types";
import dynamic from 'next/dynamic';
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const Select = dynamic(() => import('react-select'), { ssr: false });

const Slider = dynamic(() => import('@mui/material/Slider'), { 
  ssr: false,
  loading: () => <div className="w-full h-8 bg-[#37424D] border border-[#2E3944] rounded-md animate-pulse mt-1"></div>
});

interface ValuesSearchControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterSort: FilterSort;
  setFilterSort: (sort: FilterSort) => void;
  valueSort: ValueSort;
  setValueSort: (sort: ValueSort) => void;
  rangeValue: number[];
  setRangeValue: (value: number[]) => void;
  setAppliedMinValue: (value: number) => void;
  setAppliedMaxValue: (value: number) => void;
  searchSectionRef: React.RefObject<HTMLDivElement | null>;
}

export default function ValuesSearchControls({
  searchTerm,
  setSearchTerm,
  filterSort,
  setFilterSort,
  valueSort,
  setValueSort,
  rangeValue,
  setRangeValue,
  setAppliedMinValue,
  setAppliedMaxValue,
  searchSectionRef
}: ValuesSearchControlsProps) {
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const MAX_VALUE_RANGE = 100_000_000;
  const MIN_VALUE_DISTANCE = 4_000_000;
  
  const sliderMarks = [
    { value: 10_000_000, label: '10M' },
    { value: 25_000_000, label: '25M' },
    { value: 50_000_000, label: '50M' },
    { value: 75_000_000, label: '75M' },
    { value: 100_000_000 },
  ];

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

  // Handle Ctrl+F to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          // Add visual highlight
          setIsSearchHighlighted(true);
          // Remove highlight after 2 seconds
          setTimeout(() => setIsSearchHighlighted(false), 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
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
                ? "w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4"
                : "w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4"
          }
        >
          {/* Top controls row: Search + Filter + Sort */}
          <div
            className={
              !premiumStatusLoaded
                ? "w-full flex flex-col gap-4"
                : currentUserPremiumType !== 0
                  ? "w-full flex flex-col lg:flex-row lg:items-center lg:gap-4"
                  : "w-full flex flex-col gap-4"
            }
          >
            {/* Search input - takes 50% width for premium users */}
            <div className={`relative ${
              !premiumStatusLoaded
                ? "w-full"
                : currentUserPremiumType !== 0
                  ? "w-full lg:w-1/2"
                  : "w-full"
            }`}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search ${filterSort === "name-all-items" ? "items" : filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ").toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border px-4 py-2 pl-10 pr-10 text-muted placeholder-[#D3D9D4] focus:outline-none transition-all duration-300 ${
                  isSearchHighlighted 
                    ? 'border-[#124E66] bg-[#1A5F7A] shadow-lg shadow-[#124E66]/20' 
                    : 'border-[#2E3944] bg-[#37424D] focus:border-[#124E66]'
                }`}
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
            
            {/* Filter and Sort dropdowns container - takes remaining 50% width for premium users */}
            <div className={`flex gap-4 ${
              !premiumStatusLoaded
                ? "w-full flex-col"
                : currentUserPremiumType !== 0
                  ? "w-full lg:w-1/2 lg:flex-row"
                  : "w-full flex-col"
            }`}>
              {/* Filter dropdown */}
              <div className={`${
                !premiumStatusLoaded
                  ? "w-full"
                  : currentUserPremiumType !== 0
                    ? "w-full lg:w-1/2"
                    : "w-full"
              }`}>
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
              </div>

              {/* Sort dropdown */}
              <div className={`${
                !premiumStatusLoaded
                  ? "w-full"
                  : currentUserPremiumType !== 0
                    ? "w-full lg:w-1/2"
                    : "w-full"
              }`}>
                {selectLoaded ? (
                  <Select
                    value={{ value: valueSort, label: (() => {
                      switch (valueSort) {
                        case 'random': return 'Random';
                        case 'last-updated-desc': return 'Last Updated (Newest to Oldest)';
                        case 'last-updated-asc': return 'Last Updated (Oldest to Newest)';
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
                        case 'trend-avoided': return 'Avoided Trend';
                        case 'trend-dropping': return 'Dropping Trend';
                        case 'trend-unstable': return 'Unstable Trend';
                        case 'trend-hoarded': return 'Hoarded Trend';
                        case 'trend-projected': return 'Projected Trend';
                        case 'trend-stable': return 'Stable Trend';
                        case 'trend-recovering': return 'Recovering Trend';
                        case 'trend-rising': return 'Rising Trend';
                        case 'trend-hyped': return 'Hyped Trend';
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
                      { label: 'Last Updated', options: [
                        { value: 'last-updated-desc', label: 'Last Updated (Newest to Oldest)' },
                        { value: 'last-updated-asc', label: 'Last Updated (Oldest to Newest)' },
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
                      { label: 'Trend', options: [
                        { value: 'trend-avoided', label: 'Avoided Trend' },
                        { value: 'trend-dropping', label: 'Dropping Trend' },
                        { value: 'trend-unstable', label: 'Unstable Trend' },
                        { value: 'trend-hoarded', label: 'Hoarded Trend' },
                        { value: 'trend-projected', label: 'Projected Trend' },
                        { value: 'trend-stable', label: 'Stable Trend' },
                        { value: 'trend-recovering', label: 'Recovering Trend' },
                        { value: 'trend-rising', label: 'Rising Trend' },
                        { value: 'trend-hyped', label: 'Hyped Trend' },
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
            </div>
          </div>

          {/* Value range slider (always its own row) */}
          <div className="w-full">
            <div className="rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Value Range</span>
                  <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
                </div>
                <span className="text-[11px] text-muted">{rangeValue[0].toLocaleString()} - {rangeValue[1] >= MAX_VALUE_RANGE ? `${MAX_VALUE_RANGE.toLocaleString()}+` : rangeValue[1].toLocaleString()}</span>
              </div>
              <div className="px-1">
                <Slider
                  value={rangeValue}
                  onChange={(_, newValue, activeThumb) => {
                    if (!Array.isArray(newValue)) return;
                    // Clamp only the active thumb; do NOT push the other thumb
                    if (activeThumb === 0) {
                      const clampedMin = Math.min(newValue[0], rangeValue[1] - MIN_VALUE_DISTANCE);
                      setRangeValue([Math.max(0, clampedMin), rangeValue[1]]);
                    } else if (activeThumb === 1) {
                      const clampedMax = Math.max(newValue[1], rangeValue[0] + MIN_VALUE_DISTANCE);
                      setRangeValue([rangeValue[0], Math.min(MAX_VALUE_RANGE, clampedMax)]);
                    }
                  }}
                  onChangeCommitted={(_, newValue) => {
                    if (!Array.isArray(newValue)) return;
                    // Use the clamped state values to avoid raw event values like [0,0]
                    setAppliedMinValue(rangeValue[0]);
                    setAppliedMaxValue(rangeValue[1]);
                  }}
                  valueLabelDisplay="off"
                  min={0}
                  max={MAX_VALUE_RANGE}
                  step={50_000}
                  marks={sliderMarks}
                  disableSwap
                  sx={{
                    color: '#5865F2',
                    mt: 1,
                    '& .MuiSlider-markLabel': { color: '#D3D9D4' },
                    '& .MuiSlider-mark': { backgroundColor: '#D3D9D4' },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Right: Ad */}
        {premiumStatusLoaded && currentUserPremiumType === 0 && (
          <div className="w-full max-w-[480px] lg:w-[480px] lg:flex-shrink-0 flex flex-col">
            <div className="bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative" style={{ minHeight: '250px' }}>
              <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-[#212A31] px-2 py-0.5 rounded z-10">
                Advertisement
              </span>
              <DisplayAd
                adSlot="8162235433"
                adFormat="auto"
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
            <AdRemovalNotice className="mt-2" />
          </div>
        )}
      </div>
    </div>
  );
}
