"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import React from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { ThemeProvider, Skeleton, Pagination, Box, Chip, Tooltip, TextField, InputAdornment, IconButton } from '@mui/material';
import { Masonry } from '@mui/lab';
import { darkTheme } from '@/theme/darkTheme';
import { PROD_API_URL } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { formatMessageDate } from '@/utils/timestamp';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { formatFullValue } from '@/utils/values';
import { UserAvatar } from '@/utils/avatar';
import { Search, Clear } from '@mui/icons-material';
import DisplayAd from '@/components/Ads/DisplayAd';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';

interface Item {
  id: number;
  name: string;
  type: string;
  creator: string;
  cash_value: string;
  duped_value: string;
  tradable: number;
}

interface Changes {
  old: {
    cash_value?: string;
    duped_value?: string;
    tradable?: number;
    last_updated?: number;
    [key: string]: string | number | undefined;
  };
  new: {
    cash_value?: string;
    duped_value?: string;
    tradable?: number;
    last_updated?: number;
    [key: string]: string | number | undefined;
  };
}

interface SuggestionData {
  id: number;
  user_id: number;
  suggestor_name: string;
  message_id: number;
  data: {
    item_name: string;
    current_value: string;
    suggested_value: string;
    current_demand: string | null;
    suggested_demand: string | null;
    current_note: string | null;
    suggested_note: string | null;
    current_trend: string | null;
    suggested_trend: string | null;
    reason: string;
  };
  vote_data: {
    upvotes: number;
    downvotes: number;
  };
  created_at: number;
}

interface ChangeData {
  change_id: number;
  item: Item;
  changed_by: string;
  reason: string | null;
  changes: Changes;
  posted: number;
  created_at: number;
  id: number;
  suggestion?: SuggestionData;
  changed_by_id: string;
}

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: ChangeData[];
  created_at: number;
}

interface UserData {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string;
  accent_color: string;
  custom_avatar?: string;
  settings?: {
    avatar_discord: number;
  };
  premiumtype?: number;
}

export default function ChangelogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [changelog, setChangelog] = useState<ChangelogGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [userData, setUserData] = useState<Record<string, UserData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const itemsPerPage = 10;
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);

  useEffect(() => {
    if (!id) {
      setError('No changelog ID provided');
      setLoading(false);
      return;
    }
    const fetchChangelog = async () => {
      try {
        const response = await fetch(`${PROD_API_URL}/items/changelogs/get?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch changelog');
        }
        const data = await response.json();
        if (!data) {
          throw new Error('Changelog not found');
        }
        setChangelog(data);
        
        // Extract unique user IDs from changelog data
        const userIds = new Set<string>();
        data.change_data.forEach((change: ChangeData) => {
          userIds.add(change.changed_by_id);
        });
        
        // Fetch user data in batch
        if (userIds.size > 0) {
          try {
            const userResponse = await fetch(`${PROD_API_URL}/users/get/batch?ids=${Array.from(userIds).join(',')}&nocache=true`);
            if (userResponse.ok) {
              const userDataArray = await userResponse.json();
              const userDataMap = userDataArray.reduce((acc: Record<string, UserData>, user: UserData) => {
                acc[user.id] = user;
                return acc;
              }, {});
              setUserData(userDataMap);
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, [id]);

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(selectedType === type ? '' : type);
    setPage(1); // Reset to first page when filtering
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedType('');
    setPage(1);
  };

  // Helper function to create number format variations for search
  const createNumberVariations = (query: string) => {
    const variations = [query];
    
    // If query looks like a number with k/m suffix, create variations
    const numberMatch = query.match(/^(\d+(?:\.\d+)?)([kmKM])$/);
    if (numberMatch) {
      const [, number, suffix] = numberMatch;
      const num = parseFloat(number);
      const isMillions = suffix.toLowerCase() === 'm';
      const isThousands = suffix.toLowerCase() === 'k';
      
      if (isMillions) {
        const fullNumber = Math.round(num * 1000000);
        variations.push(fullNumber.toString());
        variations.push(fullNumber.toLocaleString());
      } else if (isThousands) {
        const fullNumber = Math.round(num * 1000);
        variations.push(fullNumber.toString());
        variations.push(fullNumber.toLocaleString());
      }
    }
    
    // If query is a plain number, create k/m variations
    const plainNumber = parseFloat(query.replace(/,/g, ''));
    if (!isNaN(plainNumber)) {
      if (plainNumber >= 1000000) {
        const millions = (plainNumber / 1000000).toString();
        variations.push(millions + 'm');
        variations.push(millions + 'M');
      } else if (plainNumber >= 1000) {
        const thousands = (plainNumber / 1000).toString();
        variations.push(thousands + 'k');
        variations.push(thousands + 'K');
      }
    }
    
    return variations;
  };

  // Helper function to check if text contains any of the number variations
  const textContainsNumberVariations = (text: string, query: string) => {
    const variations = createNumberVariations(query);
    return variations.some(variation => text.includes(variation));
  };

  // Filter changes based on search query and type filter
  const filteredChanges = changelog?.change_data.filter((change) => {
    // Hide cards where the only change is last_updated
    const changeKeys = Object.keys(change.changes.new);
    if (changeKeys.length === 1 && changeKeys[0] === 'last_updated') {
      return false;
    }

    // Type filter
    if (selectedType && change.item.type !== selectedType) {
      return false;
    }

    // Search query filter - only search if query has 3+ characters
    if (debouncedSearchQuery.trim().length >= 3) {
      const query = debouncedSearchQuery.toLowerCase();
      
      // Search in item name
      if (change.item.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in item type
      if (change.item.type.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in contributor names (suggestor and changed by)
      // Always search in changed_by name (the person who made the change)
      if (change.changed_by.toLowerCase().includes(query)) {
        return true;
      }
      
      // If it's a suggestion, also search in suggestor name
      if (change.suggestion && change.suggestion.suggestor_name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in value changes
      const hasValueMatch = Object.entries(change.changes.new).some(([key, newValue]) => {
        if (key === 'last_updated') return false;
        
        const oldValue = change.changes.old[key];
        
        // Format values for search
        const formatValueForSearch = (value: string | number | boolean | null | undefined) => {
          if (value === "" || value === null || value === undefined) return "";
          
          if (key === 'tradable' || key === 'is_limited') {
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (typeof value === 'number') return value === 1 ? 'true' : 'false';
            if (typeof value === 'string') return value === 'true' || value === '1' ? 'true' : 'false';
          }
          
          if (key === 'cash_value' || key === 'duped_value') {
            const formattedValue = formatFullValue(value as string).toLowerCase();
            return formattedValue;
          }
          
          return String(value).toLowerCase();
        };
        
        const oldFormatted = formatValueForSearch(oldValue);
        const newFormatted = formatValueForSearch(newValue);
        
        return textContainsNumberVariations(oldFormatted, query) || textContainsNumberVariations(newFormatted, query);
      });
      
      if (hasValueMatch) {
        return true;
      }
      
      // Search in suggestion reason
      if (change.suggestion?.data.reason) {
        const reason = change.suggestion.data.reason.toLowerCase();
        return textContainsNumberVariations(reason, query);
      }
      
      return false;
    }

    return true;
  }) || [];

  // Get unique item types for filter chips
  const uniqueTypes = changelog ? Array.from(new Set(changelog.change_data.map(change => change.item.type))) : [];

  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = filteredChanges.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen bg-[#2E3944]">
          <div className="container mx-auto mb-8 px-4 sm:px-6">
            <Breadcrumb loading={true} />
            <div className="mb-6">
              <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
              <Skeleton variant="text" width={300} height={24} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#212A31] rounded-lg p-4 border border-transparent relative">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                        <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                      </div>
                      <Skeleton variant="rectangular" width={100} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Skeleton 
                        variant="rectangular" 
                        className="w-full sm:w-[120px] h-[56.25vw] sm:h-[90px] rounded-md" 
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
                      />
                      <div className="flex-1 space-y-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="text" width={20} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="text" width={20} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                          </div>
                        </div>
                        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  if (error || !changelog) {
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen bg-[#2E3944]">
          <div className="container mx-auto mb-8 px-4 sm:px-6">
            <Breadcrumb />
            <div className="text-center text-red-500 mt-8">{error || 'Changelog not found'}</div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <div className="mb-6 flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left: Header + Search/Filter */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">
                  Changelog #{changelog.id}
                </h1>
                <p className="text-gray-400">
                  {changelog.change_count} changes • Posted on {formatMessageDate(changelog.created_at)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">Contributors:</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const contributors = new Map<string, string>();
                      changelog.change_data.forEach(change => {
                        if (change.suggestion) {
                          contributors.set(change.suggestion.user_id.toString(), change.suggestion.suggestor_name);
                        } else {
                          contributors.set(change.changed_by_id, change.changed_by);
                        }
                      });
                      return Array.from(contributors.entries()).map(([userId, displayName], index, entries) => (
                        <a
                          key={userId}
                          href={`https://discord.com/users/${userId}`}
                          className="text-blue-400 hover:text-blue-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {displayName}{index < entries.length - 1 ? ',' : ''}
                        </a>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              {/* Search and Filter Section (now under header, left-aligned) */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-3">
                  <TextField
                    fullWidth
                    placeholder="Search items, types, value changes, or contributor names..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#9CA3AF' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (searchQuery || selectedType) && (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={clearSearch}
                            size="small"
                            sx={{ color: '#9CA3AF' }}
                          >
                            <Clear />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        bgcolor: '#212A31',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2E3944',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#5865F2',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#5865F2',
                        },
                        '& .MuiInputBase-input': {
                          color: '#D3D9D4',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#9CA3AF',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </div>
                {/* Filter Chips */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">
                    Filter by item type:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueTypes.map((type) => (
                      <Chip
                        key={type}
                        label={type}
                        size="small"
                        onClick={() => handleTypeFilter(type)}
                        sx={{
                          backgroundColor: getItemTypeColor(type),
                          color: 'white',
                          '& .MuiChip-label': {
                            color: 'white',
                          },
                          '&:hover': {
                            backgroundColor: getItemTypeColor(type),
                          },
                          ...(selectedType === type && {
                            boxShadow: '0 0 0 2px #5865F2',
                            border: '2px solid #5865F2',
                          }),
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* Search Results Info */}
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                  <div className="text-sm text-gray-400">
                    Type at least 3 characters to search
                  </div>
                )}
                {(debouncedSearchQuery.trim().length >= 3 || selectedType) && (
                  <div className="text-sm text-gray-400">
                    Showing {filteredChanges.length} of {changelog.change_data.length} changes
                    {debouncedSearchQuery.trim().length >= 3 && (
                      <span> for &quot;{debouncedSearchQuery}&quot;</span>
                    )}
                    {selectedType && (
                      <span> in {selectedType}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Ad Section */}
            {currentUserPremiumType === 0 && (
              <div className="flex-shrink-0 w-full max-w-[336px] mt-4 lg:mt-0">
                <div className="w-full h-[280px] bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative flex items-center justify-center">
                  <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-[#212A31] px-2 py-0.5 rounded z-10">
                    Advertisement
                  </span>
                  <DisplayAd
                    adSlot="4408799044"
                    adFormat="rectangle"
                    style={{ display: 'block', width: '100%', height: '280px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* No Results Message */}
          {filteredChanges.length === 0 && (debouncedSearchQuery.trim().length >= 3 || selectedType) && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">No changes found</div>
              <div className="text-gray-500 text-sm">
                Try adjusting your search terms or filters
              </div>
            </div>
          )}

          <Masonry
            columns={{ xs: 1, sm: 2 }}
            spacing={2}
            sx={{ width: 'auto' }}
          >
            {paginatedChanges.map((change) => (
              <div 
                key={change.id} 
                className="bg-[#212A31] rounded-lg p-4 border border-transparent relative"
                style={{
                  borderColor: change.suggestion ? '#5865F2' : 'transparent',
                  height: 'fit-content'
                }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                                              <div className="flex-1 pr-2">
                          <h3 className="text-lg font-semibold cursor-pointer break-words">
                            <Link href={`/item/${change.item.type}/${change.item.name}`} className="text-blue-300 hover:text-blue-400 transition-colors">
                              {change.item.name}
                            </Link>
                          </h3>
                        </div>
                      {change.suggestion && (
                        <Chip
                          label={`Suggestion #${change.suggestion.id}`}
                          size="small"
                          sx={{
                            backgroundColor: '#5865F2',
                            color: 'white',
                            '& .MuiChip-label': {
                              color: 'white'
                            }
                          }}
                        />
                      )}
                    </div>
                    <Chip 
                      label={change.item.type} 
                      size="small" 
                      sx={{ 
                        backgroundColor: getItemTypeColor(change.item.type),
                        color: 'white',
                        '& .MuiChip-label': {
                          color: 'white'
                        },
                        alignSelf: 'flex-start'
                      }}
                    />
                    {change.suggestion && (
                      <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg p-3 mt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-white">
                            Suggested by{' '}
                            <a
                              href={`https://discord.com/users/${change.suggestion.user_id}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {change.suggestion.suggestor_name}
                            </a>
                          </span>
                          <div className="flex items-center justify-center text-xs">
                            <div className="flex items-center justify-center rounded-full border border-gray-600 overflow-hidden">
                              <Tooltip 
                                title={`${change.suggestion.vote_data.upvotes} upvote${change.suggestion.vote_data.upvotes !== 1 ? 's' : ''}`}
                                arrow
                                placement="top"
                                slotProps={{
                                  tooltip: {
                                    sx: {
                                      bgcolor: '#1A2228',
                                      border: '1px solid #2E3944',
                                      '& .MuiTooltip-arrow': {
                                        color: '#1A2228',
                                      },
                                    },
                                  },
                                }}
                              >
                                <div className="flex items-center justify-center gap-1 bg-green-500/10 border-r border-gray-600 px-2 py-1 cursor-help">
                                  <span className="text-green-400 font-medium">↑</span>
                                  <span className="text-green-400 font-semibold">{change.suggestion.vote_data.upvotes}</span>
                                </div>
                              </Tooltip>
                              <Tooltip 
                                title={`${change.suggestion.vote_data.downvotes} downvote${change.suggestion.vote_data.downvotes !== 1 ? 's' : ''}`}
                                arrow
                                placement="top"
                                slotProps={{
                                  tooltip: {
                                    sx: {
                                      bgcolor: '#1A2228',
                                      border: '1px solid #2E3944',
                                      '& .MuiTooltip-arrow': {
                                        color: '#1A2228',
                                      },
                                    },
                                  },
                                }}
                              >
                                <div className="flex items-center justify-center gap-1 bg-red-500/10 px-2 py-1 cursor-help">
                                  <span className="text-red-400 font-medium">↓</span>
                                  <span className="text-red-400 font-semibold">{change.suggestion.vote_data.downvotes}</span>
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                                                 {change.suggestion.data.reason && (
                           <div className="text-sm text-gray-300 mb-2">
                             <ReactMarkdown
                               remarkPlugins={[remarkBreaks]}
                               components={{
                                 strong: (props) => <b {...props} />,
                               }}
                             >
                               {change.suggestion.data.reason}
                             </ReactMarkdown>
                           </div>
                         )}
                        <div className="text-xs text-gray-400">
                          Suggested on {formatMessageDate(change.suggestion.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-[120px] h-[56.25vw] sm:h-[90px] flex-shrink-0">
                      {isVideoItem(change.item.name) ? (
                        <video
                          src={getVideoPath(change.item.type, change.item.name)}
                          className="w-full h-full object-cover rounded-md"
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : (
                        <Image
                          src={getItemImagePath(change.item.type, change.item.name, true)}
                          alt={change.item.name}
                          fill
                          unoptimized
                          className="object-cover rounded-md"
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        {Object.entries(change.changes.new).map(([key, newValue]) => {
                          if (key === 'last_updated') return null;
                          const oldValue = change.changes.old[key];
                          
                          // Helper function to format values based on field type
                          const formatValue = (value: string | number | boolean | null | undefined, fieldKey: string) => {
                            if (value === "" || value === null || value === undefined) return "N/A";
                            
                            // Handle boolean fields (tradable, is_limited)
                            if (fieldKey === 'tradable' || fieldKey === 'is_limited') {
                              if (typeof value === 'boolean') {
                                return value ? 'True' : 'False';
                              }
                              if (typeof value === 'number') {
                                return value === 1 ? 'True' : 'False';
                              }
                              if (typeof value === 'string') {
                                return value === 'true' || value === '1' ? 'True' : 'False';
                              }
                            }
                            
                            // Handle value fields to show full format like values page
                            if (fieldKey === 'cash_value' || fieldKey === 'duped_value') {
                              return formatFullValue(value as string);
                            }
                            
                            return value;
                          };
                          
                          return (
                            <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <span className="text-sm text-gray-400">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                              </span>
                                                               <div className="flex flex-col gap-1 pl-2">
                                   <div className="flex items-start gap-1">
                                     <span className="text-sm font-semibold text-muted">Old:</span>
                                     <span className="text-sm text-gray-300 break-words">
                                       {formatValue(oldValue, key)}
                                     </span>
                                   </div>
                                   <div className="flex items-start gap-1">
                                     <span className="text-sm font-semibold text-muted">New:</span>
                                     <span className="text-sm text-gray-300 break-words">
                                       {formatValue(newValue, key)}
                                     </span>
                                   </div>
                                 </div>
                            </Box>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2E3944] flex items-center gap-3">
                    {userData[change.changed_by_id] && (
                      <UserAvatar
                        userId={userData[change.changed_by_id].id}
                        avatarHash={userData[change.changed_by_id].avatar}
                        username={userData[change.changed_by_id].username}
                        size={8}
                        accent_color={userData[change.changed_by_id].accent_color}
                        custom_avatar={userData[change.changed_by_id].custom_avatar}
                        showBadge={false}
                        settings={userData[change.changed_by_id].settings}
                        premiumType={userData[change.changed_by_id].premiumtype}
                      />
                    )}
                    <div className="text-sm text-gray-400">
                      Changed by{' '}
                      <Link 
                        href={`/users/${change.changed_by_id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {change.changed_by}
                      </Link>
                      {' on '}
                      <span>{formatMessageDate(change.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>

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
        </div>
      </main>
    </ThemeProvider>
  );
} 