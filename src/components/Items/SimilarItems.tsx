import { useEffect, useState, useCallback, use, useMemo } from 'react';

import { ItemDetails } from '@/types';
import { demandOrder } from '@/utils/values';
import Image from 'next/image';
import { handleImageError, getItemImagePath, isVideoItem, getVideoPath } from '@/utils/images';
import Link from 'next/link';
import { getItemTypeColor, getTrendColor, getDemandColor } from '@/utils/badgeColors';
import { SparklesIcon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';
import { formatFullValue } from '@/utils/values';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface SimilarItemsProps {
  currentItem: ItemDetails;
  similarItemsPromise?: Promise<ItemDetails[] | null>;
}

type SortCriteria = 'similarity' | 'creator' | 'trading_metrics' | 'trend';

interface SortOption {
  value: SortCriteria;
  label: string;
}



const SimilarItems = ({ currentItem, similarItemsPromise }: SimilarItemsProps) => {
  // Use server-side data at the top level
  const serverItems = similarItemsPromise ? use(similarItemsPromise) : null;
  const typeItems: ItemDetails[] = useMemo(() => serverItems || [], [serverItems]);
  
  const [similarItems, setSimilarItems] = useState<ItemDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortCriteria>('similarity');
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Create options for the select dropdown
  const sortOptions: SortOption[] = [
    { value: 'similarity', label: 'Sort by Similarity' },
    { value: 'trading_metrics', label: 'Sort by Trading Metrics' },
    { value: 'trend', label: 'Sort by Trend' },
    { value: 'creator', label: 'Sort by Creator' }
  ];



  // Find the current selected option
  const selectedOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];



  const calculateSimilarityScore = useCallback((item1: ItemDetails, item2: ItemDetails): number => {
    let score = 0;

    // Value range similarity (50%)
    const value1 = parseValue(item1.cash_value);
    const value2 = parseValue(item2.cash_value);

    if (value1 > 0 && value2 > 0) {
      const ratio = Math.min(value1, value2) / Math.max(value1, value2);
      if (ratio >= 0.9) score += 0.5; // Within 10%
      else if (ratio >= 0.7) score += 0.3; // Within 30%
      else if (ratio >= 0.5) score += 0.1; // Within 50%
    }

    // Demand level similarity (30%)
    const demand1Index = demandOrder.indexOf(item1.demand as typeof demandOrder[number]);
    const demand2Index = demandOrder.indexOf(item2.demand as typeof demandOrder[number]);
    if (demand1Index !== -1 && demand2Index !== -1) {
      const demandDiff = Math.abs(demand1Index - demand2Index);
      if (demandDiff === 0) score += 0.3; // Exact match
      else if (demandDiff === 1) score += 0.2; // One level difference
      else if (demandDiff === 2) score += 0.1; // Two levels difference
    }

    // Limited/Seasonal status similarity (20%)
    if (
      (item1.is_limited === 1 && item2.is_limited === 1) ||
      (item1.is_seasonal === 1 && item2.is_seasonal === 1) ||
      (item1.is_limited === 0 && item2.is_limited === 0 && item1.is_seasonal === 0 && item2.is_seasonal === 0)
    ) {
      score += 0.2;
    }

    return score;
  }, []);

  const calculateTradingMetricsScore = useCallback((item1: ItemDetails, item2: ItemDetails): number => {
    let score = 0;

    // Check if both items have trading metrics
    if (!item1.metadata || !item2.metadata) {
      return 0;
    }

    const metrics1 = item1.metadata;
    const metrics2 = item2.metadata;

    // Times Traded similarity (40%)
    if (metrics1.TimesTraded && metrics2.TimesTraded) {
      const ratio = Math.min(metrics1.TimesTraded, metrics2.TimesTraded) / Math.max(metrics1.TimesTraded, metrics2.TimesTraded);
      if (ratio >= 0.9) score += 0.4; // Within 10%
      else if (ratio >= 0.7) score += 0.3; // Within 30%
      else if (ratio >= 0.5) score += 0.2; // Within 50%
      else if (ratio >= 0.3) score += 0.1; // Within 70%
    }

    // Unique Circulation similarity (30%)
    if (metrics1.UniqueCirculation && metrics2.UniqueCirculation) {
      const ratio = Math.min(metrics1.UniqueCirculation, metrics2.UniqueCirculation) / Math.max(metrics1.UniqueCirculation, metrics2.UniqueCirculation);
      if (ratio >= 0.9) score += 0.3; // Within 10%
      else if (ratio >= 0.7) score += 0.2; // Within 30%
      else if (ratio >= 0.5) score += 0.1; // Within 50%
    }

    // Demand Multiple similarity (30%)
    if (metrics1.DemandMultiple && metrics2.DemandMultiple) {
      const ratio = Math.min(metrics1.DemandMultiple, metrics2.DemandMultiple) / Math.max(metrics1.DemandMultiple, metrics2.DemandMultiple);
      if (ratio >= 0.9) score += 0.3; // Within 10%
      else if (ratio >= 0.7) score += 0.2; // Within 30%
      else if (ratio >= 0.5) score += 0.1; // Within 50%
    }

    return score;
  }, []);

  const calculateTrendSimilarityScore = useCallback((item1: ItemDetails, item2: ItemDetails): number => {
    let score = 0;

    // Check if both items have trends
    if (!item1.trend || !item2.trend || item1.trend === 'N/A' || item2.trend === 'N/A') {
      return 0;
    }

    // Exact trend match (60%)
    if (item1.trend === item2.trend) {
      score += 0.6;
    }

    // Similar trend categories (40%)
    const positiveTrends = ['Rising', 'Hyped', 'Recovering'];
    const negativeTrends = ['Dropping', 'Avoided'];
    const neutralTrends = ['Stable', 'Unstable'];
    const specialTrends = ['Hoarded', 'Projected'];

    const isPositive1 = positiveTrends.includes(item1.trend);
    const isPositive2 = positiveTrends.includes(item2.trend);
    const isNegative1 = negativeTrends.includes(item1.trend);
    const isNegative2 = negativeTrends.includes(item2.trend);
    const isNeutral1 = neutralTrends.includes(item1.trend);
    const isNeutral2 = neutralTrends.includes(item2.trend);
    const isSpecial1 = specialTrends.includes(item1.trend);
    const isSpecial2 = specialTrends.includes(item2.trend);

    if ((isPositive1 && isPositive2) || (isNegative1 && isNegative2) || (isNeutral1 && isNeutral2) || (isSpecial1 && isSpecial2)) {
      score += 0.4;
    }

    return score;
  }, []);

  useEffect(() => {
    // Calculate similarity scores and sort based on selected criteria
    const itemsWithScores = typeItems
      .filter(item => item.id !== currentItem.id) // Exclude current item
      .map(item => ({
        item,
        similarityScore: calculateSimilarityScore(currentItem, item),
        tradingMetricsScore: calculateTradingMetricsScore(currentItem, item),
        trendScore: calculateTrendSimilarityScore(currentItem, item)
      }));

    let sortedItems: ItemDetails[] = [];
    switch (sortBy) {
      case 'creator':
        // Check if current item has an unknown creator
        if (currentItem.creator === "N/A") {
          sortedItems = [];
        } else {
          sortedItems = itemsWithScores
            .filter(({ item }) => {
              // Extract creator name without ID for comparison, handling both formats
              const currentCreatorName = currentItem.creator.split(/[ (]/)[0].toLowerCase();
              const itemCreatorName = item.creator.split(/[ (]/)[0].toLowerCase();
              return currentCreatorName === itemCreatorName;
            })
            .sort((a, b) => {
              // Sort by similarity score within the same creator
              return b.similarityScore - a.similarityScore;
            })
            .map(({ item }) => item);
        }
        break;
      case 'trading_metrics':
        sortedItems = itemsWithScores
          .filter(({ tradingMetricsScore }) => tradingMetricsScore > 0) // Only include items with trading metrics
          .sort((a, b) => b.tradingMetricsScore - a.tradingMetricsScore)
          .map(({ item }) => item);
        break;
      case 'trend':
        sortedItems = itemsWithScores
          .filter(({ trendScore }) => trendScore > 0) // Only include items with trends
          .sort((a, b) => b.trendScore - a.trendScore)
          .map(({ item }) => item);
        break;
      default: // 'similarity'
        sortedItems = itemsWithScores
          .sort((a, b) => b.similarityScore - a.similarityScore)
          .map(({ item }) => item);
    }

    setSimilarItems(sortedItems.slice(0, 6)); // Get top 6
    setLoading(false);
  }, [currentItem, sortBy, calculateSimilarityScore, calculateTradingMetricsScore, calculateTrendSimilarityScore, typeItems]);

  const parseValue = (value: string): number => {
    if (value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    return num;
  };

  return (
    <div className="bg-[#212a31] border border-gray-700 rounded-xl p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-white">Similar Items</h3>
            {sortBy === 'trading_metrics' && (
              <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
            )}
          </div>
        </div>
        
        {selectLoaded ? (
          <Select
            value={selectedOption}
            onChange={(option: unknown) => {
              if (!option) {
                setSortBy('similarity');
                return;
              }
              const newValue = (option as { value: SortCriteria }).value;
              setSortBy(newValue);
            }}
            options={sortOptions}
            classNamePrefix="react-select"
            className="w-full"
            isClearable={false}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#37424D',
                borderColor: '#2E3944',
                color: '#D3D9D4',
                minHeight: '40px',
                fontSize: '14px',
                '&:hover': {
                  borderColor: '#5865F2',
                },
                '&:focus-within': {
                  borderColor: '#5865F2',
                  boxShadow: '0 0 0 1px #5865F2',
                },
              }),
              singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
              menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#5865F2' : state.isFocused ? '#2E3944' : '#37424D',
                color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                fontSize: '14px',
                '&:active': {
                  backgroundColor: '#124E66',
                  color: '#FFFFFF',
                },
              }),
              dropdownIndicator: (base) => ({
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
          <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-lg animate-pulse"></div>
        )}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-800/50 rounded-lg mb-3 border border-gray-700/50"></div>
              <div className="h-4 bg-gray-800/50 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-800/50 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : similarItems.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <SparklesIcon className="w-8 h-8 text-purple-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">
            {sortBy === 'creator' && currentItem.creator !== "N/A" 
              ? 'No Items from Same Creator' 
              : sortBy === 'trading_metrics'
              ? 'No Items with Similar Trading Metrics'
              : sortBy === 'trend'
              ? 'No Items with Similar Trends'
              : 'No Similar Items Found'
            }
          </h4>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            {sortBy === 'creator' && currentItem.creator !== "N/A"
              ? `No other items by ${currentItem.creator.split(/[ (]/)[0]} were found in the ${currentItem.type} category. Try switching to "Sort by Similarity" to see items with similar values and demand.`
              : sortBy === 'creator' && currentItem.creator === "N/A"
              ? "This item doesn't have a creator listed. Try switching to 'Sort by Similarity' to see items with similar values and demand."
              : sortBy === 'trading_metrics'
              ? "No items with similar trading metrics were found. This item might have unique trading patterns, or other items in this category don't have trading metrics data. Try switching to 'Sort by Similarity' to see items with similar values and demand."
              : sortBy === 'trend'
              ? "No items with similar trends were found. Other items in this category don't have Official Trend data. Try switching to 'Sort by Similarity' to see items with similar values and demand."
              : "We couldn't find any items similar to this one. This might be a unique item or there may not be enough data to calculate similarities."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
          {similarItems.map((item, index) => (
            <Link
              key={item.id}
              href={`/item/${item.type.toLowerCase()}/${item.name}`}
              className="group block"
            >
              <div className={`relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                item.is_seasonal === 1 
                  ? 'border-2 border-[#40c0e7]' 
                  : item.is_limited === 1 
                    ? 'border-2 border-[#ffd700]' 
                    : 'border border-gray-700/50'
              } bg-[#1a2127]`}>
                
                {/* Similarity Rank Badge */}
                <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                  #{index + 1}
                </div>

                {/* Media Section */}
                <div className="aspect-video w-full overflow-hidden bg-[#212A31] relative">
                  {isVideoItem(item.name) ? (
                    <video
                      src={getVideoPath(item.type, item.name)}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={getItemImagePath(item.type, item.name, true)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col space-y-2 p-3">
                  {/* Item Name */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted hover:text-[#40c0e7] transition-colors line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                  </div>

                  {/* Type Badge */}
                  <div className="flex flex-wrap gap-1">
                    <span 
                      className="flex items-center rounded-full px-1.5 py-0.5 text-[10px] text-white bg-opacity-80"
                      style={{ backgroundColor: getItemTypeColor(item.type) }}
                    >
                      {item.type}
                    </span>
                    {(item.tradable === 0 || item.tradable === false) && (
                      <span className="flex items-center rounded-full bg-red-600/80 px-1.5 py-0.5 text-[10px] text-white">
                        Non-Tradable
                      </span>
                    )}
                  </div>

                  {/* Values Section */}
                  <div className="space-y-1">
                    {/* Cash Value */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1.5">
                      <span className="text-[10px] text-muted font-medium">Cash</span>
                      <span className="bg-[#1d7da3] text-white text-[9px] px-1.5 py-0.5 font-bold rounded-lg shadow-sm">
                        {formatFullValue(item.cash_value)}
                      </span>
                    </div>
                    
                    {/* Duped Value */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1.5">
                      <span className="text-[10px] text-muted font-medium">Duped</span>
                      <span className="bg-gray-600 text-white text-[9px] px-1.5 py-0.5 font-bold rounded-lg shadow-sm">
                        {formatFullValue(item.duped_value)}
                      </span>
                    </div>
                    
                    {/* Demand */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1.5">
                      <span className="text-[10px] text-muted font-medium">Demand</span>
                      <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-lg shadow-sm whitespace-nowrap ${getDemandColor(item.demand)}`}>
                        {item.demand === "N/A" ? "Unknown" : item.demand}
                      </span>
                    </div>

                    {/* Trend */}
                    {item.trend && item.trend !== 'N/A' && (
                      <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1.5">
                        <span className="text-[10px] text-muted font-medium">Trend</span>
                        <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-lg shadow-sm whitespace-nowrap ${getTrendColor(item.trend)}`}>
                          {item.trend}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarItems; 