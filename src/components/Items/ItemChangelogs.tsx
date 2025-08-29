import { useMemo, useState } from 'react';
import { convertUrlsToLinks } from '@/utils/urlConverter';
import { Button, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab } from '@mui/material';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { formatFullValue } from '@/utils/values';
import { formatCustomDate } from '@/utils/timestamp';
import { Chip } from '@mui/material';
import Image from 'next/image';
import { DefaultAvatar } from '@/utils/avatar';
import type { UserData } from '@/types/auth';

type ItemChangeValue = string | number | boolean | null;

interface ItemChanges {
  value?: ItemChangeValue;
  duped_value?: ItemChangeValue;
  demand?: ItemChangeValue;
  trend?: ItemChangeValue;
  notes?: ItemChangeValue;
  last_updated?: ItemChangeValue;
  tradable?: ItemChangeValue;
  [key: string]: ItemChangeValue | undefined;
}

export interface Change {
  change_id: number;
  item: string;
  changed_by: string;
  reason: string | null;
  changes: {
    old: ItemChanges;
    new: ItemChanges;
  };
  suggestion: number | null;
  posted: number;
  created_at: number;
  item_name: string;
  changed_by_id: string;
  suggestion_data?: {
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
  };
}

interface ItemChangelogsProps {
  initialChanges?: Change[];
  initialUserMap?: Record<string, UserData>;
}

const MAX_REASON_LENGTH = 200;
const DISCORD_GUILD_ID = '981485815987318824';

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

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return { text, isTruncated: false };
  return {
    text: text.slice(0, maxLength) + '...',
    isTruncated: true
  };
};

const formatBooleanLikeValue = (value: ItemChangeValue | undefined): string => {
  if (value === undefined) return '';
  if (value === 1) return 'True';
  if (value === 0) return 'False';
  if (value === true) return 'True';
  if (value === false) return 'False';
  return String(value);
};

// Determine which field the suggestion_type applies to (match Values changelogs behavior)
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

export default function ItemChangelogs({ initialChanges, initialUserMap }: ItemChangelogsProps) {
  const changes: Change[] = useMemo(() => initialChanges ?? [], [initialChanges]);
  const loading = false;
  const error: string | null = null;
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  
  const itemsPerPage = 4;
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<'up' | 'down'>('up');
  const [activeVoters, setActiveVoters] = useState<VoteLists | null>(null);
  const userMap = initialUserMap || {};

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  // Sort changes based on sortOrder
  const sortedChanges = [...changes].sort((a, b) => {
    return sortOrder === 'newest' 
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Determine which changes are displayable (hide only last_updated or no-op changes unless it's a suggestion)
  const displayableChanges = sortedChanges.filter((change) => {
    const changeKeys = Object.keys(change.changes.new);
    if (changeKeys.length === 1 && changeKeys[0] === 'last_updated') return false;
    const hasMeaningfulChanges = Object.entries(change.changes.old).some(([key, oldValue]) => {
      if (key === 'last_updated') return false;
      const newValue = change.changes.new[key];
      return oldValue !== newValue;
    });
    return hasMeaningfulChanges || !!change.suggestion_data;
  });

  const suggestionsCount = displayableChanges.reduce((count, c) => count + (c.suggestion_data ? 1 : 0), 0);

  

  // Calculate pagination
  const totalPages = Math.ceil(displayableChanges.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = displayableChanges.slice(startIndex, startIndex + itemsPerPage);

  



  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg bg-[#212A31] p-4 animate-pulse">
            <div className="h-4 bg-[#37424D] rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-[#37424D] rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="rounded-lg bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-8 text-center border border-[#37424D] shadow-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-[#40C0E7]/20 to-[#2B9CD9]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#40C0E7]/30">
          <svg className="w-8 h-8 text-[#40C0E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Changes Available</h3>
        <p className="text-[#D3D9D4] text-sm mb-6 max-w-md mx-auto leading-relaxed">
          This item hasn&apos;t had any recorded changes yet. Changes will appear here once the item&apos;s values, demand, or other properties are updated.
        </p>
        <div className="bg-gradient-to-r from-[#40C0E7]/10 to-[#2B9CD9]/10 border border-[#40C0E7]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#40C0E7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h4 className="text-white font-medium mb-1">Stay Updated</h4>
              <p className="text-[#D3D9D4] text-sm leading-relaxed">
                Check back regularly to see when this item&apos;s values or properties are updated by our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
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
          >
            <Tab label={`Upvotes (${activeVoters?.upCount ?? 0})`} />
            <Tab label={`Downvotes (${activeVoters?.downCount ?? 0})`} />
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
                    <div className="text-xs text-muted">{new Date(voter.timestamp * 1000).toLocaleString()}</div>
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
      {/* Central Changelogs Information Banner */}
      <div className="bg-gradient-to-r from-[#5865F2]/10 to-[#4752C4]/10 border border-[#5865F2]/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#5865F2]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium mb-1">Discover All Item Changes</h4>
            <p className="text-[#D3D9D4] text-sm leading-relaxed mb-3">
              Want to see changes across all items? Visit our central changelogs page to browse all item updates, value changes, and community suggestions in one place.
            </p>
            <Link 
              href="/values/changelogs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View All Changelogs
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#2A3441] to-[#1E252B] border border-[#37424D] rounded-lg p-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              label={`${displayableChanges.length} change${displayableChanges.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                backgroundColor: '#5865F2',
                color: '#FFFFFF',
                '& .MuiChip-label': { color: '#FFFFFF', fontWeight: 600 },
              }}
            />
            {suggestionsCount > 0 && (
              <Chip
                label={`${suggestionsCount} suggestion${suggestionsCount !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  backgroundColor: '#5865F2',
                  color: '#FFFFFF',
                  '& .MuiChip-label': { color: '#FFFFFF', fontWeight: 600 },
                }}
              />
            )}
          </div>
          <Button
            variant="outlined"
            onClick={toggleSortOrder}
            startIcon={sortOrder === 'newest' ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
            size="small"
            fullWidth
            sx={{
              borderColor: '#5865F2',
              color: '#5865F2',
              backgroundColor: '#212A31',
              '&:hover': {
                borderColor: '#4752C4',
                backgroundColor: '#2B2F4C',
              },
              '@media (min-width: 640px)': {
                width: 'auto',
              },
            }}
          >
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
      </div>

      <>
          {paginatedChanges
            .map((change) => {
              // Check if there are any meaningful changes (excluding last_updated)
              const hasMeaningfulChanges = Object.entries(change.changes.old).some(([key, oldValue]) => {
                if (key === 'last_updated') return false;
                const newValue = change.changes.new[key];
                return oldValue !== newValue;
              });

              // Skip rendering if there are no meaningful changes and it's not a suggestion
              if (!hasMeaningfulChanges && !change.suggestion_data) return null;

              return (
                <div key={change.change_id} className="rounded-lg bg-[#212A31] p-4 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {change.suggestion_data ? (
                        <>
                          <Chip
                            label={`Suggestion #${change.suggestion_data.id}`}
                            size="small"
                            sx={{
                              backgroundColor: '#5865F2',
                              color: 'white',
                              '& .MuiChip-label': { color: 'white', fontWeight: 700 }
                            }}
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1"></div>
                  </div>

                  {!change.suggestion_data && (
                    <div className="border-b border-[#2E3944] mb-4"></div>
                  )}

                  {change.suggestion_data && (
                    <>
                      <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg p-3 mt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {change.suggestion_data.metadata?.avatar_hash && (
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2E3944] relative flex-shrink-0">
                                <DefaultAvatar />
                                <Image 
                                  src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.suggestion_data.user_id}/${change.suggestion_data.metadata.avatar_hash}?size=128`)}`} 
                                  alt={`${change.suggestion_data.suggestor_name}'s avatar`}
                                  fill
                                  className="object-cover"
                                  onError={(e) => { (e as unknown as { currentTarget: HTMLElement }).currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            <span className="text-sm font-medium text-white">
                              Suggested by{' '}
                              <a
                                href={`https://discord.com/users/${change.suggestion_data.user_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {change.suggestion_data.suggestor_name}
                              </a>
                            </span>
                          </div>
                          <div className="flex items-center justify-center text-xs">
                            <div className="flex items-center justify-center rounded-full border border-gray-600 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  const voters = change.suggestion_data?.vote_data.voters || [];
                                  const up = voters.filter(v => v.vote_type === 'upvote');
                                  const down = voters.filter(v => v.vote_type === 'downvote');
                                  const upCount = change.suggestion_data?.vote_data.upvotes || 0;
                                  const downCount = change.suggestion_data?.vote_data.downvotes || 0;
                                  if (up.length === 0 && down.length === 0) return;
                                  setActiveVoters({ up, down, upCount, downCount });
                                  setVotersTab('up');
                                  setVotersOpen(true);
                                }}
                                className="flex items-center justify-center gap-1 bg-green-500/10 border-r border-gray-600 px-2 py-1 hover:bg-green-500/20 focus:outline-none"
                                aria-label="View voters"
                              >
                                <span className="text-green-400 font-medium">↑</span>
                                <span className="text-green-400 font-semibold">{change.suggestion_data.vote_data.upvotes}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const voters = change.suggestion_data?.vote_data.voters || [];
                                  const up = voters.filter(v => v.vote_type === 'upvote');
                                  const down = voters.filter(v => v.vote_type === 'downvote');
                                  const upCount = change.suggestion_data?.vote_data.upvotes || 0;
                                  const downCount = change.suggestion_data?.vote_data.downvotes || 0;
                                  if (up.length === 0 && down.length === 0) return;
                                  setActiveVoters({ up, down, upCount, downCount });
                                  setVotersTab('down');
                                  setVotersOpen(true);
                                }}
                                className="flex items-center justify-center gap-1 bg-red-500/10 px-2 py-1 hover:bg-red-500/20 focus:outline-none"
                                aria-label="View voters"
                              >
                                <span className="text-red-400 font-medium">↓</span>
                                <span className="text-red-400 font-semibold">{change.suggestion_data.vote_data.downvotes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 mb-2">
                          {(() => {
                            const { text, isTruncated } = truncateText(change.suggestion_data.data.reason, MAX_REASON_LENGTH);
                            return (
                              <>
                                <ReactMarkdown
                                  components={{
                                    strong: (props) => <b {...props} />,
                                  }}
                                >
                                  {text}
                                </ReactMarkdown>
                                {isTruncated && (
                                  <a
                                    href={`https://discord.com/channels/${change.suggestion_data.metadata?.guild_id || DISCORD_GUILD_ID}/${change.suggestion_data.metadata?.channel_id || '1102253731849969764'}/${change.suggestion_data.message_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    View full reason
                                  </a>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Suggestion details removed; changes will be shown in the unified list below */}
                        <div className="text-xs text-gray-400">
                          Suggested on {formatCustomDate(change.suggestion_data.created_at * 1000)}
                        </div>
                      </div>
                      <div className="border-b border-[#2E3944] mb-4"></div>
                    </>
                  )}

                  <div className="space-y-2">
                    {Object.entries(change.changes.old).map(([key, oldValue]) => {
                      if (key === 'last_updated') return null;
                      const newValue = change.changes.new[key];
                      const isNA = (v: unknown) => v == null || (typeof v === 'string' && v.trim().toUpperCase() === 'N/A');
                      // Hide rows where both sides are effectively N/A
                      if (isNA(oldValue) && isNA(newValue)) return null;
                      if (oldValue === newValue) return null;

                      const formatValue = (k: string, v: unknown): string => {
                        if (k === 'cash_value' || k === 'duped_value') {
                          return formatFullValue(String(v));
                        }
                        if (typeof v === 'boolean' || v === 1 || v === 0 || k.startsWith('is_')) {
                          return formatBooleanLikeValue(v as ItemChangeValue | undefined);
                        }
                        const str = v === '' || v === null || v === undefined ? 'N/A' : String(v);
                        return str;
                      };

                      return (
                        <div key={key} className="flex items-start gap-2 overflow-hidden">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[#D3D9D4] capitalize">
                              {doesSuggestionTypeApplyToKey(change.suggestion_data?.metadata?.suggestion_type, key) ? (
                                <Chip
                                  label={(() => {
                                    const text = change.suggestion_data!.metadata!.suggestion_type!.replace(/_/g, ' ');
                                    return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-[#D3D9D4] line-through break-words overflow-hidden" style={{ wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                                {convertUrlsToLinks(formatValue(key, oldValue))}
                              </span>
                              <span className="text-[#D3D9D4]">→</span>
                              <span className="text-sm text-white font-medium break-words overflow-hidden" style={{ wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                                {convertUrlsToLinks(formatValue(key, newValue))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-[#2E3944] mt-4">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2E3944] relative flex-shrink-0">
                      <DefaultAvatar />
                      {userMap[change.changed_by_id]?.avatar && userMap[change.changed_by_id]?.avatar !== 'None' && (
                        <Image
                          src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.changed_by_id}/${userMap[change.changed_by_id].avatar}?size=64`)}`}
                          alt={change.changed_by}
                          fill
                          className="object-cover"
                          onError={(e) => { (e as unknown as { currentTarget: HTMLElement }).currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted">
                        Changed by{' '}
                        <Link
                          href={`/users/${change.changed_by_id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {change.changed_by}
                        </Link>
                      </span>
                      <span className="text-xs text-gray-400">on {formatCustomDate(change.created_at * 1000)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
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
        </>
    </div>
  );
} 