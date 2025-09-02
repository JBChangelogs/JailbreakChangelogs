"use client";

import { useState, useEffect } from "react";
import { Pagination, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Button, useMediaQuery } from '@mui/material';
import { Masonry } from '@mui/lab';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '@/theme/darkTheme';
import Image from 'next/image';
import { DefaultAvatar } from '@/utils/avatar';
import Link from 'next/link';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { formatMessageDate } from '@/utils/timestamp';
import { formatFullValue } from '@/utils/values';
import ReactMarkdown from 'react-markdown';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DisplayAd from '@/components/Ads/DisplayAd';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import ChangelogDetailsHeader from './ChangelogDetailsHeader';

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
      avatar_hash?: string;
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
    avatar_hash?: string;
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

type VoteRecord = {
  id: number;
  name: string;
  avatar: string;
  avatar_hash?: string;
  vote_number: number;
  vote_type: string;
  timestamp: number;
};

type VoteLists = { up: VoteRecord[]; down: VoteRecord[]; upCount: number; downCount: number };

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
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<'up' | 'down'>('up');
  const [activeVoters, setActiveVoters] = useState<VoteLists | null>(null);
  const itemsPerPage = 12;
  const isAtLeast1024 = useMediaQuery('(min-width:1024px)');
  const isAtLeast1440 = useMediaQuery('(min-width:1440px)');

  // Format boolean-like values (1/0) to True/False
  const formatBooleanLikeValue = (value: unknown): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value === 1) return 'True';
    if (value === 0) return 'False';
    if (value === true) return 'True';
    if (value === false) return 'False';
    return String(value);
  };

  // Format creator information the same way as CreatorLink component
  const formatCreatorValue = (value: unknown): { display: string; robloxId?: string } => {
    if (value === undefined || value === null) return { display: 'N/A' };
    if (value === 'N/A') return { display: '???' };
    
    const strValue = String(value);
    const match = strValue.match(/(.*?)\s*\((\d+)\)/);
    if (!match) return { display: strValue };
    
    const [, name, id] = match;
    return { display: name, robloxId: id };
  };

  // Decide which field the suggestion_type applies to
  const doesSuggestionTypeApplyToKey = (suggestionType?: string, changeKey?: string) => {
    if (!suggestionType || !changeKey) return false;
    const st = suggestionType.toLowerCase();
    const key = changeKey.toLowerCase();
    if (st === 'cash_value') return key === 'cash_value';
    if (st === 'duped_value') return key === 'duped_value';
    if (st === 'notes') return key === 'notes' || key === 'note';
    if (st === 'demand') return key === 'demand';
    if (st === 'trend') return key === 'trend';
    return false;
  };

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

    const searchLower = searchQuery.trim().toLowerCase();
    
    // Search in item name
    if (change.item.name.toLowerCase().includes(searchLower)) return true;
    
    // Search in item type
    if (change.item.type.toLowerCase().includes(searchLower)) return true;
    
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
        suggestionData.item_name,
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

  // Truncate very long queries for display purposes
  const MAX_QUERY_DISPLAY_LENGTH = 120;
  const displayQuery = searchQuery.length > MAX_QUERY_DISPLAY_LENGTH
    ? `${searchQuery.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
    : searchQuery;

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
          <div className={`${premiumStatusLoaded && currentUserPremiumType === 0 ? 'lg:col-span-2' : ''}`}>
            <ChangelogDetailsHeader changelog={changelog} userData={userData} />
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

        {/* Search - match Values page styling */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-muted placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF] hover:text-muted"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
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

        <div className="mb-2">
          <p className="text-muted">
            {searchQuery
              ? `Found ${filteredChanges.length} ${filteredChanges.length === 1 ? 'change' : 'changes'} matching "${displayQuery}"${selectedType ? ` in ${selectedType}` : ''}`
              : `Total ${selectedType ? `${selectedType} changes` : 'Changes'}: ${filteredChanges.length}`}
          </p>
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
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

        {/* Voters Dialog */}
        <Dialog 
          open={votersOpen} 
          onClose={() => setVotersOpen(false)} 
          fullWidth 
          maxWidth="xs"
          slotProps={{
            paper: {
              sx: {
                backgroundColor: '#212A31',
                border: '1px solid #2E3944',
                borderRadius: '8px',
              }
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#212A31', color: '#FFFFFF', borderBottom: '1px solid #2E3944' }}>Voters</DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#212A31' }}>
            <Tabs
              value={votersTab === 'up' ? 0 : 1}
              onChange={(_, val) => setVotersTab(val === 0 ? 'up' : 'down')}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 'auto',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#D3D9D4',
                  '&.Mui-selected': {
                    color: '#FFFFFF',
                    fontWeight: 600,
                  },
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#5865F2',
                  height: '3px',
                }
              }}
            >
              <Tab 
                label={
                  <div className="flex flex-col items-center">
                    <span className="font-medium">Upvotes</span>
                    <span className="text-xs text-muted mt-1">({activeVoters?.upCount ?? 0})</span>
                  </div>
                } 
              />
              <Tab 
                label={
                  <div className="flex flex-col items-center">
                    <span className="font-medium">Downvotes</span>
                    <span className="text-xs text-muted mt-1">({activeVoters?.downCount ?? 0})</span>
                  </div>
                } 
              />
            </Tabs>
            <div className="mt-3 space-y-2">
              {(votersTab === 'up' ? (activeVoters?.up || []) : (activeVoters?.down || [])).length === 0 ? (
                <div className="text-sm text-muted">No voters to display.</div>
              ) : (
                (votersTab === 'up' ? (activeVoters?.up || []) : (activeVoters?.down || [])).map((voter: VoteRecord) => (
                  <div key={voter.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2E3944] relative flex-shrink-0">
                      <DefaultAvatar />
                      {voter.avatar_hash && (
                        <Image 
                          src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${voter.id}/${voter.avatar_hash}?size=128`)}`}
                          alt={voter.name} 
                          fill 
                          className="object-cover"
                          onError={(e) => { (e as unknown as { currentTarget: HTMLElement }).currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">
                        <a
                          href={`https://discord.com/users/${voter.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {voter.name}
                        </a>
                      </div>
                      <div className="text-xs text-muted">{new Date(voter.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#212A31', borderTop: '1px solid #2E3944' }}>
            <Button onClick={() => setVotersOpen(false)} variant="contained">Close</Button>
          </DialogActions>
        </Dialog>

        {/* Changes Grid */}
        {paginatedChanges.length > 0 ? (
          <Masonry columns={isAtLeast1440 ? 3 : isAtLeast1024 ? 2 : 1} spacing={2} sx={{ mx: 'auto', maxWidth: { xs: 640, sm: 'none' } }}>
            {paginatedChanges.map((change) => (
              <div key={change.change_id} className="bg-[#212A31] rounded-lg p-4 border border-[#37424D] relative">
                {/* Suggestion # Pill - Responsive placement */}
                {change.suggestion && (
                  <div className="mb-2 lg:mb-0 lg:absolute lg:top-3 lg:right-3">
                    <Chip
                      label={`Suggestion #${change.suggestion.id}`}
                      size="small"
                      sx={{
                        backgroundColor: '#5865F2',
                        color: 'white',
                        fontSize: '0.75rem',
                        '& .MuiChip-label': { color: 'white', fontWeight: 700 }
                      }}
                    />
                  </div>
                )}

                {/* Item Header */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
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
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <Link
                        href={`/item/${change.item.type}/${encodeURIComponent(change.item.name)}`}
                        className="text-white font-semibold hover:text-[#40C0E7] transition-colors break-words whitespace-normal block lg:pr-24"
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
                    {/* Header: avatar, name, type chip, and votes */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {change.suggestion.metadata?.avatar_hash && (
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2E3944] relative flex-shrink-0">
                            <DefaultAvatar />
                            <Image 
                              src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.suggestion.user_id}/${change.suggestion.metadata.avatar_hash}?size=128`)}`}
                              alt={`${change.suggestion.suggestor_name}'s avatar`}
                              fill
                              className="object-cover"
                              onError={(e) => { (e as unknown as { currentTarget: HTMLElement }).currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white truncate">
                          Suggested by{' '}
                          <a
                            href={`https://discord.com/users/${change.suggestion.user_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#40C0E7] hover:text-[#2B9CD9] hover:underline"
                          >
                            {change.suggestion.suggestor_name}
                          </a>
                        </span>
                        
                      </div>
                      <div className="flex items-center justify-center text-xs">
                        <div className="flex items-center justify-center rounded-full border border-gray-600 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const voters = change.suggestion?.vote_data.voters || [];
                              const up = voters.filter(v => v.vote_type === 'upvote');
                              const down = voters.filter(v => v.vote_type === 'downvote');
                              const upCount = change.suggestion?.vote_data.upvotes || 0;
                              const downCount = change.suggestion?.vote_data.downvotes || 0;
                              if (up.length === 0 && down.length === 0) return;
                              setActiveVoters({ up, down, upCount, downCount });
                              setVotersTab('up');
                              setVotersOpen(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-green-500/10 border-r border-gray-600 px-2 py-1 hover:bg-green-500/20 focus:outline-none"
                            aria-label="View voters"
                          >
                            <span className="text-green-400 font-medium">↑</span>
                            <span className="text-green-400 font-semibold">{change.suggestion.vote_data.upvotes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const voters = change.suggestion?.vote_data.voters || [];
                              const up = voters.filter(v => v.vote_type === 'upvote');
                              const down = voters.filter(v => v.vote_type === 'downvote');
                              const upCount = change.suggestion?.vote_data.upvotes || 0;
                              const downCount = change.suggestion?.vote_data.downvotes || 0;
                              if (up.length === 0 && down.length === 0) return;
                              setActiveVoters({ up, down, upCount, downCount });
                              setVotersTab('down');
                              setVotersOpen(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-red-500/10 px-2 py-1 hover:bg-red-500/20 focus:outline-none"
                            aria-label="View voters"
                          >
                            <span className="text-red-400 font-medium">↓</span>
                            <span className="text-red-400 font-semibold">{change.suggestion.vote_data.downvotes}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reason (full) */}
                    <div className="text-sm text-[#D3D9D4] mb-2">
                      <ReactMarkdown
                        components={{
                          strong: (props) => <strong className="font-bold text-white" {...props} />,
                          p: (props) => <div className="whitespace-pre-line" {...props} />,
                        }}
                      >
                        {change.suggestion.data.reason?.replace(
                          /(Common Trades?:?)/gi,
                          '**$1**'
                        )}
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
                    // Hide rows where both current (old) and suggested (new) are effectively N/A
                    // Treat null/undefined and the literal string "N/A" (case-insensitive) as N/A
                    const isNA = (v: unknown) => v == null || (typeof v === 'string' && v.trim().toUpperCase() === 'N/A');
                    if (isNA(oldValue) && isNA(newValue)) return null;
                    if (oldValue === newValue) return null;

                    return (
                      <div key={key} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#D3D9D4] capitalize">
                            {doesSuggestionTypeApplyToKey(change.suggestion?.metadata?.suggestion_type, key) ? (
                              <Chip
                                label={(() => {
                                  const text = change.suggestion!.metadata!.suggestion_type!.replace(/_/g, ' ');
                                  return text
                                    .split(' ')
                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(' ');
                                })()}
                                size="small"
                                sx={{
                                  backgroundColor: '#124E66',
                                  color: '#FFFFFF',
                                  '& .MuiChip-label': { color: '#FFFFFF', fontWeight: 600 },
                                }}
                              />
                            ) : (
                              <>
                                {key.replace(/_/g, ' ')}:
                              </>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#D3D9D4] line-through break-words overflow-hidden" style={{ wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                                {key === 'cash_value' || key === 'duped_value' 
                                  ? formatFullValue(oldValue as string)
                                  : key === 'creator'
                                  ? (() => {
                                      const creatorInfo = formatCreatorValue(oldValue);
                                      if (creatorInfo.robloxId) {
                                        return (
                                          <a
                                            href={`https://www.roblox.com/users/${creatorInfo.robloxId}/profile`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                          >
                                            {creatorInfo.display}
                                          </a>
                                        );
                                      }
                                      return creatorInfo.display;
                                    })()
                                  : formatBooleanLikeValue(oldValue)}
                              </span>
                              <span className="text-[#D3D9D4]">→</span>
                              <span className="text-sm text-white font-medium break-words overflow-hidden" style={{ wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                                {key === 'cash_value' || key === 'duped_value' 
                                  ? formatFullValue(newValue as string)
                                  : key === 'creator'
                                  ? (() => {
                                      const creatorInfo = formatCreatorValue(newValue);
                                      if (creatorInfo.robloxId) {
                                        return (
                                          <a
                                            href={`https://www.roblox.com/users/${creatorInfo.robloxId}/profile`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                          >
                                            {creatorInfo.display}
                                          </a>
                                        );
                                      }
                                      return creatorInfo.display;
                                    })()
                                  : formatBooleanLikeValue(newValue)}
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
              {searchQuery && `No changes match "${displayQuery}"`}
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