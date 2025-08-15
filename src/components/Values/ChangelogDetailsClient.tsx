"use client";

import { useState, useEffect } from "react";
import { Pagination, Chip, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Masonry } from '@mui/lab';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '@/theme/darkTheme';
import Image from 'next/image';
import Link from 'next/link';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { formatMessageDate } from '@/utils/timestamp';
import { formatFullValue } from '@/utils/values';
import ReactMarkdown from 'react-markdown';

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
  user_id: number | string;
  suggestor_name: string;
  message_id: number | string;
  data: {
    // Old format fields
    item_name: string;
    current_value?: string;
    suggested_value?: string;
    current_demand?: string | null;
    suggested_demand?: string | null;
    current_note?: string | null;
    suggested_note?: string | null;
    current_trend?: string | null;
    suggested_trend?: string | null;
    reason: string;
    // New format fields
    item_type?: string;
    item_id?: number;
    current_cash_value?: string;
    suggested_cash_value?: string;
    current_duped_value?: string;
    suggested_duped_value?: string;
    current_notes?: string;
    suggested_notes?: string;
  };
  vote_data: {
    upvotes: number;
    downvotes: number;
    voters?: Array<{
      id: number;
      name: string;
      avatar: string;
      vote_number: number;
      vote_type: string;
      timestamp: number;
    }>;
  };
  created_at: number;
  metadata?: {
    avatar?: string;
    guild_id?: number;
    channel_id?: number;
    suggestion_type?: string;
  };
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

interface ChangelogDetailsClientProps {
  changelog: ChangelogGroup;
  userData: Record<string, UserData>;
}

export default function ChangelogDetailsClient({ changelog, userData }: ChangelogDetailsClientProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const itemsPerPage = 12;

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

  // Filter changes based on search query and selected type
  const filteredChanges = changelog.change_data.filter((change) => {
    if (searchQuery === '') {
      const matchesType = selectedType === '' || change.item.type === selectedType;
      return matchesType;
    }

    const searchLower = searchQuery.toLowerCase();
    
    // Search in item name
    if (change.item.name.toLowerCase().includes(searchLower)) return true;
    
    // Search in changed_by name
    if (change.changed_by.toLowerCase().includes(searchLower)) return true;
    
    // Search in reason
    if (change.reason && change.reason.toLowerCase().includes(searchLower)) return true;
    
    // Search in suggestion reason
    if (change.suggestion?.data.reason && change.suggestion.data.reason.toLowerCase().includes(searchLower)) return true;
    
    // Search in suggestion suggestor name
    if (change.suggestion?.suggestor_name && change.suggestion.suggestor_name.toLowerCase().includes(searchLower)) return true;
    
    // Search in changes (old and new values)
    const hasValueMatch = Object.entries(change.changes.old).some(([key, oldValue]) => {
      if (key === 'last_updated') return false;
      
      const newValue = change.changes.new[key];
      if (oldValue === newValue) return false;
      
      // Convert values to strings for searching
      const oldValueStr = String(oldValue || '');
      const newValueStr = String(newValue || '');
      
      return oldValueStr.toLowerCase().includes(searchLower) || 
             newValueStr.toLowerCase().includes(searchLower);
    });
    
    if (hasValueMatch) return true;
    
    // Search in suggestion data values
    if (change.suggestion?.data) {
      const suggestionData = change.suggestion.data;
      const suggestionFields = [
        suggestionData.current_value,
        suggestionData.suggested_value,
        suggestionData.current_cash_value,
        suggestionData.suggested_cash_value,
        suggestionData.current_duped_value,
        suggestionData.suggested_duped_value,
        suggestionData.current_demand,
        suggestionData.suggested_demand,
        suggestionData.current_note,
        suggestionData.suggested_note,
        suggestionData.current_trend,
        suggestionData.suggested_trend,
        suggestionData.current_notes,
        suggestionData.suggested_notes
      ];
      
      const hasSuggestionValueMatch = suggestionFields.some(field => 
        field && String(field).toLowerCase().includes(searchLower)
      );
      
      if (hasSuggestionValueMatch) return true;
    }
    
    return false;
  }).filter((change) => {
    const matchesType = selectedType === '' || change.item.type === selectedType;
    return matchesType;
  });

  // Get unique item types for filter
  const itemTypes = Array.from(new Set(changelog.change_data.map(change => change.item.type))).sort();

  // Calculate pagination
  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = filteredChanges.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedType('');
    setPage(1);
  };

  if (!changelog) {
    return (
      <div className="text-center text-white py-8">
        <p>Changelog not found</p>
      </div>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="space-y-6">
        {/* Header with Side-by-Side Layout */}
        <div className={`grid gap-6 ${premiumStatusLoaded && currentUserPremiumType === 0 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Changelog Info - Takes up full width for premium users, 2/3 for non-premium */}
          <div className={`${premiumStatusLoaded && currentUserPremiumType === 0 ? 'lg:col-span-2' : ''} bg-gradient-to-r from-[#2A3441] to-[#1E252B] rounded-lg p-6 border border-[#37424D]`}>
            <h1 className="text-3xl font-bold text-white mb-2">
              Changelog #{changelog.id}
            </h1>
            <p className="text-[#D3D9D4] mb-4">
              {changelog.change_count} change{changelog.change_count !== 1 ? 's' : ''} • Posted on {formatMessageDate(changelog.created_at * 1000)}
            </p>
            
            {/* Contributors */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[#D3D9D4] mb-2">Contributors:</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const allContributors = new Map<string, string>();
                  
                  changelog.change_data.forEach(change => {
                    if (change.changed_by && change.changed_by_id) {
                      allContributors.set(change.changed_by, change.changed_by_id);
                    }
                    
                    if (change.suggestion?.suggestor_name && change.suggestion.user_id) {
                      allContributors.set(change.suggestion.suggestor_name, String(change.suggestion.user_id));
                    }
                  });
                  
                  const sortedContributors = Array.from(allContributors.entries()).sort(([a], [b]) => 
                    a.toLowerCase().localeCompare(b.toLowerCase())
                  );
                  
                  return sortedContributors.map(([contributorName, discordId], index) => (
                    <span key={contributorName}>
                      <a
                        href={`https://discord.com/users/${discordId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#40C0E7] hover:text-[#2B9CD9] hover:underline text-sm"
                      >
                        {contributorName}
                      </a>
                      {index < sortedContributors.length - 1 && (
                        <span className="text-[#D3D9D4] text-sm">,</span>
                      )}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Ad - Takes up 1/3 of the space, only show for non-premium users */}
          {premiumStatusLoaded && currentUserPremiumType === 0 && (
            <div className="lg:col-span-1">
              <div className="bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative h-full" style={{ minHeight: '250px' }}>
                <span className="absolute top-2 left-2 text-xs text-muted bg-[#212A31] px-2 py-0.5 rounded z-10">
                  Advertisement
                </span>
                <DisplayAd
                  adSlot="8162235433"
                  adFormat="auto"
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="bg-[#212A31] rounded-lg p-4 border border-[#37424D]">
          <TextField
            fullWidth
            placeholder="Search changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="text-[#D3D9D4]" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <Clear className="text-[#D3D9D4]" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#D3D9D4',
                '& fieldset': {
                  borderColor: '#37424D',
                },
                '&:hover fieldset': {
                  borderColor: '#5865F2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5865F2',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#D3D9D4',
              },
            }}
          />
        </div>

        {/* Filter by Item Type - Chip Style */}
        <div className="bg-[#212A31] rounded-lg p-4 border border-[#37424D]">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-[#D3D9D4] mb-2">Filter by item type:</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip
              label="All Types"
              onClick={() => setSelectedType('')}
              variant={selectedType === '' ? 'filled' : 'outlined'}
              sx={{
                backgroundColor: selectedType === '' ? '#5865F2' : 'transparent',
                borderColor: selectedType === '' ? '#5865F2' : '#37424D',
                color: selectedType === '' ? '#FFFFFF' : '#D3D9D4',
                '&:hover': {
                  backgroundColor: selectedType === '' ? '#4752C4' : 'rgba(88, 101, 242, 0.1)',
                  borderColor: selectedType === '' ? '#4752C4' : '#5865F2',
                },
              }}
            />
            {itemTypes.map((type) => (
              <Chip
                key={type}
                label={type}
                onClick={() => setSelectedType(type)}
                variant={selectedType === type ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: selectedType === type ? getItemTypeColor(type) : 'transparent',
                  borderColor: selectedType === type ? getItemTypeColor(type) : '#37424D',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: selectedType === type ? getItemTypeColor(type) : 'rgba(88, 101, 242, 0.1)',
                    borderColor: selectedType === type ? getItemTypeColor(type) : '#5865F2',
                  },
                }}
              />
            ))}
          </div>
        </div>

        {/* Changes Grid */}
        {paginatedChanges.length > 0 ? (
          <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
            {paginatedChanges.map((change) => (
              <div key={change.change_id} className="bg-[#212A31] rounded-lg p-4 border border-[#37424D] relative">
                {/* Suggestion # Pill - Top Right Corner of Main Card */}
                {change.suggestion && (
                  <div className="absolute top-3 right-3">
                    <Chip
                      label={`Suggestion #${change.suggestion.id}`}
                      size="small"
                      sx={{
                        backgroundColor: '#5865F2',
                        color: 'white',
                        fontSize: '0.75rem',
                        '& .MuiChip-label': { color: 'white' }
                      }}
                    />
                  </div>
                )}

                {/* Item Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#37424D]">
                    {isVideoItem(change.item.name) ? (
                      <video
                        src={getVideoPath(change.item.type, change.item.name)}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onError={() => {}}
                      />
                    ) : (
                      <Image
                        src={getItemImagePath(change.item.type, change.item.name, true)}
                        alt={change.item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <Link
                        href={`/item/${change.item.type}/${encodeURIComponent(change.item.name)}`}
                        className="text-white font-semibold hover:text-[#40C0E7] transition-colors truncate block"
                      >
                        {change.item.name}
                      </Link>
                      <Chip
                        label={change.item.type}
                        size="small"
                        sx={{
                          backgroundColor: getItemTypeColor(change.item.type),
                          color: 'white',
                          fontSize: '0.75rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Suggestion Data - Show First if Exists */}
                {change.suggestion && (
                  <div className="mt-4 p-3 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg relative">
                    {/* Votes - Top Right Corner of Suggestion Panel */}
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center justify-center text-xs">
                        <div className="flex items-center justify-center rounded-full border border-gray-600 overflow-hidden">
                          <Tooltip
                            title={`${change.suggestion.vote_data.upvotes} upvote${change.suggestion.vote_data.upvotes !== 1 ? 's' : ''}`}
                            placement="top"
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: '#0F1419',
                                  color: '#D3D9D4',
                                  fontSize: '0.75rem',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #2E3944',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                  '& .MuiTooltip-arrow': {
                                    color: '#0F1419',
                                  }
                                }
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-1 bg-green-500/10 border-r border-gray-600 px-2 py-1 cursor-help">
                              <span className="text-green-400 font-medium">↑</span>
                              <span className="text-green-400 font-semibold">{change.suggestion.vote_data.upvotes}</span>
                            </div>
                          </Tooltip>
                          <Tooltip
                            title={`${change.suggestion.vote_data.downvotes} downvote${change.suggestion.vote_data.downvotes !== 1 ? 's' : ''}`}
                            placement="top"
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: '#0F1419',
                                  color: '#D3D9D4',
                                  fontSize: '0.75rem',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #2E3944',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                  '& .MuiTooltip-arrow': {
                                    color: '#0F1419',
                                  }
                                }
                              }
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

                    <div className="text-sm text-[#D3D9D4] mb-2">
                      Suggested by{' '}
                      <a
                        href={`https://discord.com/users/${change.suggestion.user_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#40C0E7] hover:text-[#2B9CD9] hover:underline"
                      >
                        {change.suggestion.suggestor_name}
                      </a>
                    </div>
                    <div className="text-sm text-[#D3D9D4] mb-2">
                      <ReactMarkdown
                        components={{
                          strong: (props) => <strong className="font-bold text-white" {...props} />,
                          p: (props) => <div className="whitespace-pre-line" {...props} />,
                        }}
                      >
                        {change.suggestion.data.reason}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs text-[#D3D9D4]">
                      Suggested on {formatMessageDate(change.suggestion.created_at * 1000)}
                    </div>
                  </div>
                )}

                {/* Changes */}
                <div className="space-y-2 mb-4 mt-6">
                  {Object.entries(change.changes.old).map(([key, oldValue]) => {
                    if (key === 'last_updated') return null;
                    const newValue = change.changes.new[key];
                    if (oldValue === newValue) return null;

                    return (
                      <div key={key} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#D3D9D4] capitalize">
                            {key.replace(/_/g, ' ')}:
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#D3D9D4] line-through">
                                {key === 'cash_value' || key === 'duped_value' 
                                  ? formatFullValue(oldValue as string)
                                  : String(oldValue || 'N/A')}
                              </span>
                              <span className="text-[#D3D9D4]">→</span>
                              <span className="text-sm text-white font-medium">
                                {key === 'cash_value' || key === 'duped_value' 
                                  ? formatFullValue(newValue as string)
                                  : String(newValue || 'N/A')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#37424D]">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={userData[change.changed_by_id]?.avatar 
                        ? `https://cdn.discordapp.com/avatars/${change.changed_by_id}/${userData[change.changed_by_id].avatar}.webp?size=64`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(change.changed_by_id) % 5}.png`
                      }
                      alt={change.changed_by}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="text-sm text-[#D3D9D4]">
                    Changed by{' '}
                    <Link
                      href={`/users/${change.changed_by_id}`}
                      className="text-[#40C0E7] hover:text-[#2B9CD9] hover:underline"
                    >
                      {change.changed_by}
                    </Link>
                    {' '}on {formatMessageDate(change.created_at * 1000)}
                  </span>
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center text-white py-8">
            <p className="text-lg font-medium mb-2">No changes found</p>
            <p className="text-[#D3D9D4] text-sm">
              {searchQuery && `No changes match "${searchQuery}"`}
              {searchQuery && selectedType && ' and '}
              {selectedType && `No changes found for item type "${selectedType}"`}
              {!searchQuery && !selectedType && 'No changes available in this changelog'}
            </p>
            {(searchQuery || selectedType) && (
              <button
                onClick={clearSearch}
                className="mt-3 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
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
                    backgroundColor: 'rgba(88, 101, 242, 0.1)',
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
} 