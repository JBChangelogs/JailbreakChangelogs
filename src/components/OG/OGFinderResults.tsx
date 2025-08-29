'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RobloxUser } from '@/types';
import Image from 'next/image';
import { Pagination } from '@mui/material';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fetchMissingRobloxData, fetchOriginalOwnerAvatars } from '@/app/inventories/actions';
import { getItemImagePath, isVideoItem, isDriftItem, getDriftVideoPath, getVideoPath, handleImageError } from '@/utils/images';
import localFont from 'next/font/local';
import dynamic from 'next/dynamic';
import SearchForm from './SearchForm';

const Select = dynamic(() => import('react-select'), { ssr: false });

const bangers = localFont({
  src: '../../../public/fonts/Bangers.ttf',
});

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  user_id: string;
  logged_at: number;
  history: string | Array<{
    UserId: number;
    TradeTime: number;
  }>;
}

interface OGSearchData {
  results: OGItem[];
  count: number;
}

interface OGFinderResultsProps {
  initialData?: OGSearchData;
  robloxId: string;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  error?: string;
}

export default function OGFinderResults({ 
  initialData, 
  robloxId, 
  robloxUsers: initialRobloxUsers, 
  robloxAvatars: initialRobloxAvatars, 
  error 
}: OGFinderResultsProps) {
  const [searchId, setSearchId] = useState(robloxId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'traded-desc' | 'unique-desc' | 'created-asc' | 'created-desc' | 'duplicates'>('created-desc');
  const [page, setPage] = useState(1);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<Record<string, RobloxUser>>(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<Record<string, string>>(initialRobloxAvatars || {});
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OGItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const router = useRouter();

  const itemsPerPage = 20;
  const MAX_SEARCH_LENGTH = 50;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    
    setIsLoading(true);
    router.push(`/og/${searchId.trim()}`);
  };

  const handleItemClick = (item: OGItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  // Load Select component
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(initialRobloxUsers || {});
  }, [initialRobloxUsers]);

  useEffect(() => {
    setLocalRobloxAvatars(initialRobloxAvatars || {});
  }, [initialRobloxAvatars]);



  const fetchMissingUserData = useCallback(async (userIds: string[]) => {
    try {
      const { userData, avatarData } = await fetchMissingRobloxData(userIds);
      
      if (userData && Object.keys(userData).length > 0) {
        setLocalRobloxUsers(prev => ({ ...prev, ...userData }));
      }
      
      if (avatarData && Object.keys(avatarData).length > 0) {
        setLocalRobloxAvatars(prev => ({ ...prev, ...avatarData }));
      }
    } catch (error) {
      console.error('Failed to fetch missing user data:', error);
    }
  }, []);

  const fetchOriginalOwnerAvatarsData = useCallback(async (userIds: string[]) => {
    try {
      const avatarData = await fetchOriginalOwnerAvatars(userIds);
      
      if (avatarData && Object.keys(avatarData).length > 0) {
        setLocalRobloxAvatars(prev => ({ ...prev, ...avatarData }));
      }
    } catch (error) {
      console.error('Failed to fetch original owner avatars:', error);
    }
  }, []);

  const getUserDisplay = useCallback((userId: string): string => {
    const user = localRobloxUsers[userId];
    return user?.displayName || user?.name || userId;
  }, [localRobloxUsers]);

  const getUsername = useCallback((userId: string): string => {
    const user = localRobloxUsers[userId];
    return user?.name || userId;
  }, [localRobloxUsers]);

  const getUserAvatar = useCallback((userId: string): string | null => {
    const avatar = localRobloxAvatars[userId];
    return avatar && typeof avatar === 'string' && avatar.trim() !== '' ? avatar : null;
  }, [localRobloxAvatars]);

  // Progressive loading for current page items (only current owners)
  useEffect(() => {
    if (!initialData?.results || initialData.results.length === 0) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    initialData.results.forEach(item => {
      // Add current owner ID if missing
      if (item.user_id && /^\d+$/.test(item.user_id)) {
        const user = localRobloxUsers[item.user_id];
        if (!user?.displayName && !user?.name) {
          userIdsToLoad.push(item.user_id);
        }
        
        const avatar = localRobloxAvatars[item.user_id];
        if (!avatar || typeof avatar !== 'string' || avatar.trim() === '') {
          avatarIdsToLoad.push(item.user_id);
        }
      }
    });

    // Fetch missing user data if any (deduplicate arrays)
    if (userIdsToLoad.length > 0) {
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      fetchMissingUserData(uniqueUserIds);
    }
    
    if (avatarIdsToLoad.length > 0) {
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];
      fetchOriginalOwnerAvatarsData(uniqueAvatarIds);
    }
  }, [initialData?.results, fetchMissingUserData, fetchOriginalOwnerAvatarsData, localRobloxUsers, localRobloxAvatars]);

  // Progressive loading for trade history modal
  useEffect(() => {
    if (!selectedItem?.history) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];
    
    try {
      // Parse history if it's a JSON string
      const historyData = typeof selectedItem.history === 'string' ? JSON.parse(selectedItem.history) : selectedItem.history;
      
      if (Array.isArray(historyData)) {
        historyData.forEach(trade => {
          if (trade.UserId) {
            const tradeUserId = trade.UserId.toString();
            const user = localRobloxUsers[tradeUserId];
            if (!user?.displayName && !user?.name) {
              userIdsToLoad.push(tradeUserId);
            }
            
            const avatar = localRobloxAvatars[tradeUserId];
            if (!avatar || typeof avatar !== 'string' || avatar.trim() === '') {
              avatarIdsToLoad.push(tradeUserId);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing history data:', error);
    }
    
    if (userIdsToLoad.length > 0) {
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      fetchMissingUserData(uniqueUserIds);
    }
    
    if (avatarIdsToLoad.length > 0) {
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];
      fetchOriginalOwnerAvatarsData(uniqueAvatarIds);
    }
  }, [selectedItem?.id, selectedItem?.history, fetchMissingUserData, fetchOriginalOwnerAvatarsData, localRobloxUsers, localRobloxAvatars]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter and sort items
  const filteredItems = initialData?.results?.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(item.categoryTitle);
    
    return matchesSearch && matchesCategory;
  }) || [];



  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortOrder) {
      case 'duplicates':
        const categoryCompare = a.categoryTitle.localeCompare(b.categoryTitle);
        if (categoryCompare !== 0) return categoryCompare;
        return a.title.localeCompare(b.title);
      case 'alpha-asc':
        return a.title.localeCompare(b.title);
      case 'alpha-desc':
        return b.title.localeCompare(a.title);
      case 'traded-desc':
        return b.timesTraded - a.timesTraded;
      case 'unique-desc':
        return b.uniqueCirculation - a.uniqueCirculation;
      case 'created-asc':
        return a.logged_at - b.logged_at;
      case 'created-desc':
        return b.logged_at - a.logged_at;

      default:
        return 0;
    }
  });

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Get unique categories
  const categories = [...new Set(initialData?.results?.map(item => item.categoryTitle) || [])];

  if (error) {
    return (
      <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
        <div className="text-center">
          <div className="text-red-400 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!initialData?.results || initialData.results.length === 0) {
    return (
      <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium mb-2">No OG Items Found</div>
          <div className="text-gray-500">This user doesn&apos;t have any original items in our database.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      
      {/* Search Form */}
      <SearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        handleSearch={handleSearch}
        isLoading={isLoading}
        externalIsLoading={false}
        error={error}
      />

      {/* User Info */}
      <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
        <h2 className="text-xl font-semibold mb-4 text-muted">User Information</h2>
        
        {/* Roblox User Profile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-[#2E3944] rounded-lg border border-[#37424D]">
          {getUserAvatar(robloxId) ? (
            <Image
              src={getUserAvatar(robloxId)!}
              alt="Roblox Avatar"
              width={64}
              height={64}
              className="rounded-full bg-[#212A31] flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-[#37424D] rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-muted break-words">
              {getUserDisplay(robloxId)}
            </h3>
            <p className="text-sm text-muted opacity-75 break-words">
              @{getUsername(robloxId)}
            </p>
            <a
              href={`https://www.roblox.com/users/${robloxId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-400 text-sm mt-1 transition-colors"
            >
              View Roblox Profile
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        
        {/* Stats */}
        <div className="text-center">
          <div className="text-sm text-muted">Original Items Found</div>
          <div className="text-2xl font-bold text-[#4ade80]">{initialData.count?.toLocaleString()}</div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
        <h2 className="text-xl font-semibold text-muted mb-4">OG Items</h2>
        
        <div className="flex flex-col gap-4 mb-4">
          {/* Search, Category, and Sort Filters - Side by Side */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Search Bar - First */}
            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxLength={MAX_SEARCH_LENGTH}
                className="w-full px-3 py-2 pl-10 pr-10 border border-[#2E3944] bg-[#37424D] rounded-lg shadow-sm focus:outline-none focus:border-[#5865F2] text-muted placeholder-[#D3D9D4]"
              />
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF] hover:text-muted"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Category Filter - Second */}
            <div className="w-full sm:w-1/3">
              {selectLoaded ? (
                <Select
                  value={selectedCategories.length > 0 ? { value: selectedCategories[0], label: selectedCategories[0] } : null}
                  onChange={(option) => {
                    if (!option) {
                      setSelectedCategories([]);
                      return;
                    }
                    setSelectedCategories([(option as { value: string }).value]);
                  }}
                  options={categories.map(cat => ({ value: cat, label: cat }))}
                  classNamePrefix="react-select"
                  className="w-full"
                  isMulti={false}
                  isClearable={true}
                  placeholder="Filter by category..."
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
                    placeholder: (base) => ({
                      ...base,
                      color: '#D3D9D4',
                    }),
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-md animate-pulse"></div>
              )}
            </div>
            
            {/* Sort Filter - Third */}
            <div className="w-full sm:w-1/3">
              {selectLoaded ? (
                <Select
                  value={{
                    value: sortOrder,
                    label: (() => {
                      switch (sortOrder) {
                        case 'duplicates': return 'Group Duplicates';
                        case 'alpha-asc': return 'Name (A to Z)';
                        case 'alpha-desc': return 'Name (Z to A)';
                        case 'traded-desc': return 'Monthly Traded (High to Low)';
                        case 'unique-desc': return 'Monthly Unique (High to Low)';
                        case 'created-asc': return 'Logged On (Oldest to Newest)';
                        case 'created-desc': return 'Logged On (Newest to Oldest)';
                        default: return 'Random Order';
                      }
                    })()
                  }}
                  onChange={(option) => {
                    if (!option) {
                      setSortOrder('created-desc');
                      return;
                    }
                    setSortOrder((option as { value: 'alpha-asc' | 'alpha-desc' | 'traded-desc' | 'unique-desc' | 'created-asc' | 'created-desc' | 'duplicates' }).value);
                  }}
                    options={[
                    { label: 'Date', options: [
                      { value: 'created-desc', label: 'Logged On (Newest to Oldest)' },
                      { value: 'created-asc', label: 'Logged On (Oldest to Newest)' },
                    ]},
                    { label: 'Duplicates', options: [
                      { value: 'duplicates', label: 'Group Duplicates' },
                    ]},
                    { label: 'Alphabetically', options: [
                      { value: 'alpha-asc', label: 'Name (A to Z)' },
                      { value: 'alpha-desc', label: 'Name (Z to A)' },
                    ]},
                    { label: 'Activity', options: [
                      { value: 'traded-desc', label: 'Monthly Traded (High to Low)' },
                      { value: 'unique-desc', label: 'Monthly Unique (High to Low)' },
                    ]},
                  ]}
                  classNamePrefix="react-select"
                  className="w-full"
                  isMulti={false}
                  isClearable={true}
                  placeholder="Sort by..."
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
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-md animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-300">
            {filteredItems.length} items found
          </h3>
        </div>

        {/* No Items Found Message */}
        {filteredItems.length === 0 && (searchTerm || selectedCategories.length > 0) && (
          <div className="text-center py-8 text-muted">
            <p className="break-words">
              No items found
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategories.length > 0 && ` in selected categories`}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-[#5865F2] hover:text-[#4752C4] hover:underline"
                >
                  Clear search
                </button>
              )}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-[#5865F2] hover:text-[#4752C4] hover:underline"
                >
                  Clear categories
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Summary - Only show when there are items */}
        {(searchTerm || selectedCategories.length > 0) && filteredItems.length > 0 && (
          <div className="mb-4 p-3 bg-[#2E3944] rounded-lg border border-[#37424D]">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="font-medium">Active filters:</span>
              {selectedCategories.length > 0 && (
                <span className="px-2 py-1 bg-[#5865F2] text-white rounded-md text-xs">
                  Category: {selectedCategories[0]}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-1 bg-[#5865F2] text-white rounded-md text-xs break-words">
                  Search: &quot;{searchTerm}&quot;
                </span>
              )}
              <span className="text-xs opacity-75">
                Showing {filteredItems.length} of {initialData?.count || 0} items
              </span>
            </div>
          </div>
        )}

        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mb-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedItems.map((item) => {
            return (
              <div
                key={item.id}
                className="text-white rounded-lg p-3 border-2 relative cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[400px] flex flex-col bg-gray-700 border-gray-800"
                onClick={() => handleItemClick(item)}
              >
                {/* Title */}
                <div className="text-left mb-4">
                  <p className={`${bangers.className} text-md text-gray-300 mb-1 tracking-wide`}>
                    {item.categoryTitle}
                  </p>
                  <h2 className={`${bangers.className} text-2xl break-words tracking-wide`}>
                    {item.title}
                  </h2>
                </div>
                
                {/* Item Image */}
                <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-[#212A31]">
                  {!['Brakes'].includes(item.categoryTitle) ? (
                    isVideoItem(item.title) ? (
                      <video
                        src={getVideoPath(item.categoryTitle, item.title)}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : isDriftItem(item.categoryTitle) ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={getItemImagePath(item.categoryTitle, item.title, true)}
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={handleImageError}
                        />
                        <video
                          src={getDriftVideoPath(item.title)}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity duration-300"
                          muted
                          playsInline
                          loop
                        />
                      </div>
                    ) : (
                      <Image
                        src={getItemImagePath(item.categoryTitle, item.title, true)}
                        alt={item.title}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">No Image</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Statistics */}
                <div className="space-y-2 text-center flex-1 flex flex-col justify-center">
                  <div>
                    <div className="text-sm opacity-90">MONTHLY TRADED</div>
                    <div className="text-xl font-bold">{item.timesTraded.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">MONTHLY UNIQUE</div>
                    <div className="text-xl font-bold">{item.uniqueCirculation.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">CURRENT OWNER</div>
                    <div className="text-xl font-bold italic">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#212A31] border border-[#2E3944] flex-shrink-0 flex items-center justify-center">
                          {getUserAvatar(item.user_id) ? (
                            <Image
                              src={getUserAvatar(item.user_id)!}
                              alt="Current Owner Avatar"
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <a
                          href={`https://www.roblox.com/users/${item.user_id}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-400 hover:underline transition-colors text-center break-words"
                        >
                          {getUserDisplay(item.user_id)}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">LOGGED ON</div>
                    <div className="text-xl font-bold">{formatDateOnly(item.logged_at)}</div>
                  </div>
                </div>
                
                {/* Season and Level badges - always show container for consistent layout */}
                <div className="flex justify-center gap-2 mt-3 pt-3 border-t border-white/20 min-h-[40px]">
                  {item.season && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-400 shadow-lg">
                      <span className="text-white text-xs font-bold">S{item.season}</span>
                    </div>
                  )}
                  {item.level && (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center border-2 border-green-400 shadow-lg">
                      <span className="text-white text-xs font-bold">L{item.level}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
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

      {/* Trade History Modal */}
      {selectedItem && (
                <Dialog open={showHistoryModal} onClose={closeHistoryModal} className="relative z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
                  <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="mx-auto w-full max-w-2xl rounded-lg bg-[#212A31] border border-[#2E3944] max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-[#2E3944] gap-4">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg sm:text-xl font-semibold text-muted">Trade History</Dialog.Title>
                <p className="text-sm text-muted opacity-75 truncate">{selectedItem.title}</p>
              </div>
              <button
                onClick={closeHistoryModal}
                className="rounded-full p-1 text-muted hover:bg-[#2E3944] hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */} 
            <div className="p-6 overflow-y-auto max-h-[60vh]">
                              {selectedItem.history && selectedItem.history.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Process history to show actual trades between users
                    const history = typeof selectedItem.history === 'string' 
                      ? JSON.parse(selectedItem.history) 
                      : selectedItem.history;
                    
                    if (!Array.isArray(history) || history.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-muted">This item has no trade history.</p>
                        </div>
                      );
                    }
                    
                    // Reverse the history to match inventory modal
                    const reversedHistory = history.slice().reverse();
                    
                    // If there's only one history entry, hide it (user obtained the item)
                    if (reversedHistory.length === 1) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-muted">This item has no trade history.</p>
                        </div>
                      );
                    }
                    
                    // Group history into trades between users
                    const trades = [];
                    for (let i = 0; i < reversedHistory.length - 1; i++) {
                      const toUser = reversedHistory[i];
                      const fromUser = reversedHistory[i + 1];
                      

                      
                      trades.push({
                        fromUser,
                        toUser,
                        tradeNumber: reversedHistory.length - i - 1
                      });
                    }
                    
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted mb-4">
                          <span>Total Trades: {trades.length}</span>
                        </div>
                        
                                                <div className="space-y-3">
                          {trades.map((trade, index) => {
                            return (
                              <div
                                key={`${trade.fromUser.UserId}-${trade.toUser.UserId}-${trade.toUser.TradeTime}`}
                                className={`p-3 rounded-lg border ${
                                  index === trades.length - 1 
                                    ? 'bg-[#1A5F7A] border-[#124E66] shadow-lg' 
                                    : 'bg-[#2E3944] border-[#37424D]'
                                }`}
                              >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* From User */}
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#212A31] border border-[#2E3944] flex-shrink-0 flex items-center justify-center">
                                          {getUserAvatar(trade.fromUser.UserId.toString()) ? (
                                            <Image
                                              src={getUserAvatar(trade.fromUser.UserId.toString())!}
                                              alt="User Avatar"
                                              width={24}
                                              height={24}
                                              className="rounded-full"
                                            />
                                          ) : (
                                            <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                          )}
                                        </div>
                                        <a
                                          href={`https://www.roblox.com/users/${trade.fromUser.UserId}/profile`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-300 hover:text-blue-400 hover:underline transition-colors font-medium truncate"
                                        >
                                          {getUserDisplay(trade.fromUser.UserId.toString()) || `User ${trade.fromUser.UserId}`}
                                        </a>
                                      </div>
                                      
                                      {/* Arrow */}
                                      <div className="flex items-center gap-1 text-muted">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-xs">Trade #{trade.tradeNumber}</span>
                                      </div>
                                      
                                      {/* To User */}
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#212A31] border border-[#2E3944] flex-shrink-0 flex items-center justify-center">
                                          {getUserAvatar(trade.toUser.UserId.toString()) ? (
                                            <Image
                                              src={getUserAvatar(trade.toUser.UserId.toString())!}
                                              alt="User Avatar"
                                              width={24}
                                              height={24}
                                              className="rounded-full"
                                            />
                                          ) : (
                                            <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                          )}
                                        </div>
                                        <a
                                          href={`https://www.roblox.com/users/${trade.toUser.UserId}/profile`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-300 hover:text-blue-400 hover:underline transition-colors font-medium truncate"
                                        >
                                          {getUserDisplay(trade.toUser.UserId.toString()) || `User ${trade.toUser.UserId}`}
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Trade Date */}
                                <div className="text-sm text-muted flex-shrink-0">
                                  {formatDate(trade.toUser.TradeTime)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted">This item has no trade history.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </Dialog>
      )}
      </div>
    </div>
  );
}
