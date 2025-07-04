import { useEffect, useState, useCallback } from 'react';
import { PROD_API_URL } from '@/services/api';
import { ItemDetails } from '@/types';
import { demandOrder } from '@/utils/values';
import Image from 'next/image';
import { handleImageError, getItemImagePath, isVideoItem, getVideoPath } from '@/utils/images';
import Link from 'next/link';
import { getItemTypeColor } from '@/utils/badgeColors';
import { SparklesIcon } from "@heroicons/react/24/outline";
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface SimilarItemsProps {
  currentItem: ItemDetails;
}

type SortCriteria = 'similarity' | 'creator';

const SimilarItems = ({ currentItem }: SimilarItemsProps) => {
  const [similarItems, setSimilarItems] = useState<ItemDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortCriteria>('similarity');
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Create options for the select dropdown
  const sortOptions = [
    { value: 'similarity', label: 'Sort by Similarity' },
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

  useEffect(() => {
    const fetchAndCalculateSimilarItems = async () => {
      try {
        // Fetch only items of the same type
        const response = await fetch(`${PROD_API_URL}/items/get?type=${encodeURIComponent(currentItem.type)}`);
        if (!response.ok) throw new Error('Failed to fetch items');
        const typeItems: ItemDetails[] = await response.json();

        // Calculate similarity scores and sort based on selected criteria
        const itemsWithScores = typeItems
          .filter(item => item.id !== currentItem.id) // Exclude current item
          .map(item => ({
            item,
            score: calculateSimilarityScore(currentItem, item)
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
                  return b.score - a.score;
                })
                .map(({ item }) => item);
            }
            break;
          default: // 'similarity'
            sortedItems = itemsWithScores
              .sort((a, b) => b.score - a.score)
              .map(({ item }) => item);
        }

        setSimilarItems(sortedItems.slice(0, 8)); // Get top 8
      } catch (error) {
        console.error('Error fetching similar items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateSimilarItems();
  }, [currentItem, sortBy, calculateSimilarityScore]);

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
          <h3 className="text-xl font-semibold text-white">Similar Items</h3>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
            {sortBy === 'creator' && currentItem.creator !== "N/A" ? 'No Items from Same Creator' : 'No Similar Items Found'}
          </h4>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            {sortBy === 'creator' && currentItem.creator !== "N/A"
              ? `No other items by ${currentItem.creator.split(/[ (]/)[0]} were found in the ${currentItem.type} category. Try switching to "Sort by Similarity" to see items with similar values and demand.`
              : sortBy === 'creator' && currentItem.creator === "N/A"
              ? "This item doesn't have a creator listed. Try switching to 'Sort by Similarity' to see items with similar values and demand."
              : "We couldn't find any items similar to this one. This might be a unique item or there may not be enough data to calculate similarities."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {similarItems.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.type.toLowerCase()}/${item.name}`}
              className="group"
            >
              <div className="bg-[#2e3944] border border-gray-700/50 rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-purple-500/30 hover:shadow-lg">
                <div className="relative aspect-video">
                  <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                    #{similarItems.indexOf(item) + 1}
                  </div>
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
                      unoptimized
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="text-gray-300 font-medium group-hover:text-purple-400 transition-colors line-clamp-2 h-12 leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span 
                      className="inline-block px-2 py-1 text-xs rounded-full text-white font-medium"
                      style={{ backgroundColor: getItemTypeColor(item.type) }}
                    >
                      {item.type}
                    </span>
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